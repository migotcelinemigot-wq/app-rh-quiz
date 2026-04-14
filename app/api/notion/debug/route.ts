import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendQuestionsToThemePage, saveQuestionsToNotion } from "@/lib/notion";
import type { ThemeKey } from "@/lib/themes";

export const dynamic = "force-dynamic";

/**
 * GET /api/notion/debug
 * Teste la connexion Notion et affiche l'état complet du système.
 * Envoie aussi une vraie question de test dans la première page thème trouvée.
 */
export async function GET() {
  const result: Record<string, unknown> = {};

  // 1. Variables d'environnement
  result.env = {
    GROQ_API_KEY:           process.env.GROQ_API_KEY           ? "✅ SET" : "❌ MISSING",
    NOTION_API_KEY:         process.env.NOTION_API_KEY         ? "✅ SET" : "❌ MISSING",
    NOTION_QUESTIONS_DB_ID: process.env.NOTION_QUESTIONS_DB_ID ? `✅ ${process.env.NOTION_QUESTIONS_DB_ID}` : "❌ NOT SET",
    NOTION_PARENT_PAGE_ID:  process.env.NOTION_PARENT_PAGE_ID  ? `✅ ${process.env.NOTION_PARENT_PAGE_ID}`  : "❌ NOT SET",
    DATABASE_URL:           process.env.DATABASE_URL           ? "✅ SET" : "❌ MISSING",
  };

  // 2. AppConfig — toutes les clés Notion
  try {
    const configs = await prisma.appConfig.findMany({
      where: { key: { startsWith: "NOTION_" } },
    });
    result.appConfig = configs.length > 0
      ? Object.fromEntries(configs.map((c) => [c.key, c.value]))
      : "EMPTY — aucune clé NOTION_ en base";
  } catch (err) {
    result.appConfig = `DB ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 3. Test réel : envoyer une question de test dans la première page trouvée
  let testPageId: string | undefined;
  let testTheme: string | undefined;

  try {
    const configs = await prisma.appConfig.findMany({
      where: { key: { startsWith: "NOTION_THEME_PAGE_" } },
      take: 1,
    });
    if (configs[0]) {
      testPageId = configs[0].value;
      testTheme  = configs[0].key.replace("NOTION_THEME_PAGE_", "");
    }
  } catch {
    // ignore
  }

  // 3a. Test append page thème
  if (testPageId) {
    try {
      await appendQuestionsToThemePage(testPageId, [{
        theme:       testTheme as ThemeKey,
        difficulty:  2,
        type:        "QCM",
        question:    "🧪 Question de test — Debug endpoint",
        options:     ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
        answer:      "A",
        explanation: "📌 Définition : Test de l'intégration Notion depuis /api/notion/debug.",
        source:      "Debug endpoint — /api/notion/debug",
      }]);
      result.notionPageAppend = `✅ SUCCESS — page thème: ${testTheme} (${testPageId})`;
    } catch (err) {
      result.notionPageAppend = `❌ FAILED — ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    result.notionPageAppend = "⚠️ Aucune page thème en AppConfig — lance /api/notion/setup";
  }

  // 3b. Test save DB Notion (bibliothèque)
  let dbId: string | undefined;
  try {
    const cfg = await prisma.appConfig.findUnique({ where: { key: "NOTION_QUESTIONS_DB_ID" } });
    dbId = cfg?.value ?? process.env.NOTION_QUESTIONS_DB_ID;
    result.dbIdFound = dbId ?? "NOT FOUND";
  } catch (err) {
    result.dbIdFound = `DB ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  if (dbId) {
    try {
      await saveQuestionsToNotion([{
        theme:       (testTheme ?? "DROIT_TRAVAIL") as ThemeKey,
        difficulty:  2,
        type:        "QCM",
        question:    "🧪 Question de test DB — Debug endpoint",
        options:     ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
        answer:      "A",
        explanation: "📌 Définition : Test save DB depuis /api/notion/debug.",
        source:      "Debug endpoint — /api/notion/debug",
      }], dbId);
      result.notionDbSave = `✅ SUCCESS — sauvegardé dans DB (${dbId})`;
    } catch (err) {
      result.notionDbSave = `❌ FAILED — ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    result.notionDbSave = "⚠️ Aucun DB ID trouvé";
  }

  return NextResponse.json(result, { status: 200 });
}
