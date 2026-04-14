import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
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

    // 2. Sauvegarder dans Notion en arrière-plan (waitUntil garde la fonction en vie sur Vercel)
    waitUntil(
      saveToNotionBackground(generated, theme as string, difficulty).catch((err) =>
        console.error("[quiz/generate] Notion save failed:", err)
      )
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

    const themeKey   = theme as string;
    const themeLabel = theme === "TOUS"
      ? "Tous les thèmes"
      : (THEMES[theme as ThemeKey]?.label ?? theme);
    const cacheKey   = `NOTION_THEME_PAGE_${themeKey}`;

    console.log("[notion-bg] Start — theme:", themeKey, "| cacheKey:", cacheKey);

    // ── 1. Sauvegarder dans la page thème ──────────────────────────────────────
    let themePageId: string | undefined;

    // Chercher l'ID dans AppConfig (peuplé par /api/notion/setup)
    try {
      const stored = await prisma.appConfig.findUnique({ where: { key: cacheKey } });
      themePageId = stored?.value ?? undefined;
      console.log("[notion-bg] AppConfig lookup →", themePageId ? `found: ${themePageId}` : "NOT FOUND");
    } catch (dbErr) {
      console.error("[notion-bg] AppConfig DB error:", dbErr);
    }

    // Si pas en AppConfig, tenter de créer la page (nécessite NOTION_PARENT_PAGE_ID)
    if (!themePageId) {
      const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
      console.log("[notion-bg] NOTION_PARENT_PAGE_ID:", parentPageId ? "SET" : "NOT SET");
      if (parentPageId) {
        try {
          themePageId = await ensureThemePage(parentPageId, themeKey, themeLabel);
          await prisma.appConfig.upsert({
            where:  { key: cacheKey },
            update: { value: themePageId },
            create: { key: cacheKey, value: themePageId },
          });
          console.log("[notion-bg] Created theme page:", themePageId);
        } catch (createErr) {
          console.error("[notion-bg] Failed to create theme page:", createErr);
        }
      } else {
        console.warn("[notion-bg] Cannot create theme page — NOTION_PARENT_PAGE_ID not set");
      }
    }

    // ── 2. Récupérer l'ID de la base de données ──────────────────────────────────
    let dbId = process.env.NOTION_QUESTIONS_DB_ID;
    if (!dbId) {
      try {
        const config = await prisma.appConfig.findUnique({ where: { key: "NOTION_QUESTIONS_DB_ID" } });
        dbId = config?.value;
        console.log("[notion-bg] DB ID from AppConfig:", dbId ?? "NOT FOUND");
      } catch (dbErr) {
        console.error("[notion-bg] AppConfig DB ID lookup error:", dbErr);
      }
    }
    if (!dbId) {
      try {
        dbId = await ensureQuestionsDatabase();
        await prisma.appConfig.upsert({
          where:  { key: "NOTION_QUESTIONS_DB_ID" },
          update: { value: dbId },
          create: { key: "NOTION_QUESTIONS_DB_ID", value: dbId },
        });
        console.log("[notion-bg] Created new DB:", dbId);
      } catch (createDbErr) {
        console.error("[notion-bg] ensureQuestionsDatabase error:", createDbErr);
      }
    }

    // ── 3. Lancer page thème + DB en parallèle ──────────────────────────────────
    const saves: Promise<void>[] = [];

    if (themePageId) {
      saves.push(
        appendQuestionsToThemePage(themePageId, questionsToSave)
          .then(() => console.log("[notion-bg] ✅ Theme page append OK"))
          .catch((err) => console.error("[notion-bg] appendQuestionsToThemePage error:", err))
      );
    } else {
      console.warn("[notion-bg] No theme page ID — skipping page append");
    }

    if (dbId) {
      saves.push(
        saveQuestionsToNotion(questionsToSave, dbId)
          .then(() => console.log("[notion-bg] ✅ DB save OK"))
          .catch((err) => console.error("[notion-bg] saveQuestionsToNotion error:", err))
      );
    } else {
      console.warn("[notion-bg] No DB ID — skipping DB save");
    }

    await Promise.all(saves);
    console.log("[notion-bg] ✅ All saves complete");

  } catch (err) {
    console.error("[notion-bg] Unexpected error:", err);
  }
}
