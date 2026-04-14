import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendQuestionsToThemePage } from "@/lib/notion";
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
    NOTION_API_KEY:         process.env.NOTION_API_KEY ? "✅ SET" : "❌ MISSING",
    NOTION_QUESTIONS_DB_ID: process.env.NOTION_QUESTIONS_DB_ID ? `✅ ${process.env.NOTION_QUESTIONS_DB_ID}` : "❌ NOT SET",
    NOTION_PARENT_PAGE_ID:  process.env.NOTION_PARENT_PAGE_ID  ? `✅ ${process.env.NOTION_PARENT_PAGE_ID}`  : "❌ NOT SET",
    DATABASE_URL:           process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING",
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

  if (testPageId) {
    try {
      await appendQuestionsToThemePage(testPageId, [{
        theme:       testTheme as ThemeKey,
        difficulty:  2,
        type:        "QCM",
        question:    "🧪 Question de test — Debug endpoint",
        options:     ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
        answer:      "A",
        explanation: "📌 Définition : Ceci est une question de test envoyée depuis /api/notion/debug pour vérifier que l'intégration Notion fonctionne correctement.",
        source:      "Debug endpoint — /api/notion/debug",
      }]);
      result.notionAppend = `✅ SUCCESS — question de test ajoutée à la page thème: ${testTheme} (${testPageId})`;
    } catch (err) {
      result.notionAppend = `❌ FAILED — ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    result.notionAppend = "⚠️ Aucune page thème trouvée en AppConfig — lance d'abord /api/notion/setup";
  }

  return NextResponse.json(result, { status: 200 });
}
