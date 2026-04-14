import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/claude";
import { saveQuestionsToNotion, ensureQuestionsDatabase } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import type { ThemeKey } from "@/lib/themes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, difficulty = 2, count = 5, subcategory, questionType } = body as {
      theme: ThemeKey;
      difficulty: 1 | 2 | 3;
      count: number;
      subcategory?: string;
      questionType?: string;
    };

    if (!theme) {
      return NextResponse.json({ error: "Thème requis" }, { status: 400 });
    }

    // 1. Générer les questions via Groq (priorité absolue)
    console.log("[quiz/generate] Generating", count, "questions, theme:", theme, "subcategory:", subcategory, "type:", questionType);
    const generated = await generateQuestions(theme, difficulty, count, subcategory, questionType);
    console.log("[quiz/generate] Generated:", generated.length);

    // Préparer les questions avec IDs temporaires pour le quiz
    const questionsWithTempIds = generated.map((q, i) => ({
      ...q,
      theme,
      difficulty,
      id: `temp_${Date.now()}_${i}`,
      createdAt: new Date().toISOString(),
    }));

    // 2. Sauvegarder dans Notion en arrière-plan (non bloquant)
    // Si Notion échoue, le quiz continue quand même
    saveToNotionBackground(generated, theme, difficulty).catch((err) =>
      console.error("[quiz/generate] Notion save failed (non-blocking):", err)
    );

    return NextResponse.json({ questions: questionsWithTempIds, count: questionsWithTempIds.length });

  } catch (error) {
    console.error("[quiz/generate] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des questions" },
      { status: 500 }
    );
  }
}

async function saveToNotionBackground(
  generated: Awaited<ReturnType<typeof generateQuestions>>,
  theme: ThemeKey,
  difficulty: number
) {
  try {
    let dbId = process.env.NOTION_QUESTIONS_DB_ID;
    if (!dbId) {
      const config = await prisma.appConfig.findUnique({ where: { key: "NOTION_QUESTIONS_DB_ID" } });
      dbId = config?.value;
    }
    if (!dbId) {
      dbId = await ensureQuestionsDatabase();
      await prisma.appConfig.upsert({
        where: { key: "NOTION_QUESTIONS_DB_ID" },
        update: { value: dbId },
        create: { key: "NOTION_QUESTIONS_DB_ID", value: dbId },
      });
    }
    await saveQuestionsToNotion(
      generated.map((q) => ({ ...q, theme, difficulty })),
      dbId
    );
    console.log("[quiz/generate] Notion save complete");
  } catch (err) {
    console.error("[quiz/generate] Notion background save error:", err);
  }
}
