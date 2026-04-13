import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/claude";
import { saveQuestionsToNotion, ensureQuestionsDatabase } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import type { ThemeKey } from "@/lib/themes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, difficulty = 2, count = 10 } = body as {
      theme: ThemeKey;
      difficulty: 1 | 2 | 3;
      count: number;
    };

    if (!theme) {
      return NextResponse.json({ error: "Thème requis" }, { status: 400 });
    }

    console.log("[quiz/generate] 1. Generating", count, "questions, theme:", theme);
    const generated = await generateQuestions(theme, difficulty, count);
    console.log("[quiz/generate] 2. Questions generated:", generated.length);

    // Récupérer ou créer la base de données Notion
    let dbId = process.env.NOTION_QUESTIONS_DB_ID;
    if (!dbId) {
      const config = await prisma.appConfig.findUnique({ where: { key: "NOTION_QUESTIONS_DB_ID" } });
      dbId = config?.value;
    }
    if (!dbId) {
      console.log("[quiz/generate] 3. Creating Notion DB...");
      dbId = await ensureQuestionsDatabase();
      await prisma.appConfig.upsert({
        where: { key: "NOTION_QUESTIONS_DB_ID" },
        update: { value: dbId },
        create: { key: "NOTION_QUESTIONS_DB_ID", value: dbId },
      });
    }
    console.log("[quiz/generate] 4. Notion DB ready:", dbId);

    const saved = await saveQuestionsToNotion(
      generated.map((q) => ({ ...q, theme, difficulty })),
      dbId
    );
    console.log("[quiz/generate] 5. Saved to Notion:", saved.length);

    return NextResponse.json({ questions: saved, count: saved.length });
  } catch (error) {
    console.error("Erreur génération quiz:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des questions" },
      { status: 500 }
    );
  }
}
