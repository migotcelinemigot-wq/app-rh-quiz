import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/claude";
import {
  appendQuestionsToThemePage,
  ensureThemePage,
  saveQuestionsToNotion,
  ensureQuestionsDatabase,
} from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import type { ThemeKey } from "@/lib/themes";
import { THEMES } from "@/lib/themes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, difficulty = 2, count = 5, subcategory, questionType } = body as {
      theme: ThemeKey | "TOUS";
      difficulty: 1 | 2 | 3;
      count: number;
      subcategory?: string;
      questionType?: string;
    };

    if (!theme) {
      return NextResponse.json({ error: "Thème requis" }, { status: 400 });
    }

    // 1. Générer les questions via Groq
    console.log("[quiz/generate] Generating", count, "questions, theme:", theme, "subcategory:", subcategory, "type:", questionType);
    const generated = await generateQuestions(theme, difficulty, count, subcategory, questionType);
    console.log("[quiz/generate] Generated:", generated.length);

    const questionsWithTempIds = generated.map((q, i) => ({
      ...q,
      theme,
      difficulty,
      id: `temp_${Date.now()}_${i}`,
      createdAt: new Date().toISOString(),
    }));

    // 2. Sauvegarder dans Notion en arrière-plan (non bloquant)
    saveToNotionBackground(generated, theme as string, difficulty).catch((err) =>
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
  theme: string,
  difficulty: number
) {
  try {
    const questionsToSave = generated.map((q) => ({ ...q, theme: theme as ThemeKey, difficulty }));

    // ── 1. Sauvegarder dans la page thème (structure wiki lisible) ──────────
    const themeKey   = theme as string;
    const themeLabel = theme === "TOUS"
      ? "Tous les thèmes"
      : (THEMES[theme as ThemeKey]?.label ?? theme);
    const cacheKey   = `NOTION_THEME_PAGE_${themeKey}`;

    // Chercher l'ID dans AppConfig (peuplé par /api/notion/setup)
    let themePageId: string | undefined;
    const stored = await prisma.appConfig.findUnique({ where: { key: cacheKey } });
    themePageId = stored?.value ?? undefined;

    // Si pas en AppConfig, créer la page (nécessite NOTION_PARENT_PAGE_ID)
    if (!themePageId) {
      const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
      if (parentPageId) {
        themePageId = await ensureThemePage(parentPageId, themeKey, themeLabel);
        await prisma.appConfig.upsert({
          where:  { key: cacheKey },
          update: { value: themePageId },
          create: { key: cacheKey, value: themePageId },
        });
        console.log("[quiz/generate] Created theme page for:", themeLabel);
      } else {
        console.warn("[quiz/generate] Notion theme page not found and NOTION_PARENT_PAGE_ID not set — skipping page save");
      }
    }

    if (themePageId) {
      await appendQuestionsToThemePage(themePageId, questionsToSave);
      console.log("[quiz/generate] Questions appended to theme page:", themeLabel);
    }

    // ── 2. Sauvegarder dans la base de données (pour la bibliothèque app) ──
    let dbId = process.env.NOTION_QUESTIONS_DB_ID;
    if (!dbId) {
      const config = await prisma.appConfig.findUnique({ where: { key: "NOTION_QUESTIONS_DB_ID" } });
      dbId = config?.value;
    }
    if (!dbId) {
      dbId = await ensureQuestionsDatabase();
      await prisma.appConfig.upsert({
        where:  { key: "NOTION_QUESTIONS_DB_ID" },
        update: { value: dbId },
        create: { key: "NOTION_QUESTIONS_DB_ID", value: dbId },
      });
    }
    await saveQuestionsToNotion(questionsToSave, dbId);
    console.log("[quiz/generate] Notion DB save complete");

  } catch (err) {
    console.error("[quiz/generate] Notion background save error:", err);
  }
}
