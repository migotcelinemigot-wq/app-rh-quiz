import { NextRequest, NextResponse } from "next/server";
import { ensureThemePage, appendQuestionsToThemePage } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import { THEMES, THEME_KEYS } from "@/lib/themes";

export const dynamic = "force-dynamic";

/**
 * GET /api/notion/setup
 * Crée toutes les sous-pages thème sous Quiz RH CODE et stocke leurs IDs.
 * Appeler une seule fois depuis le navigateur.
 */
export async function GET(req: NextRequest) {
  try {
    // Lire le parent page ID depuis l'env ou le query param
    const { searchParams } = new URL(req.url);
    const parentPageId =
      searchParams.get("parent") ||
      process.env.NOTION_PARENT_PAGE_ID;

    if (!parentPageId) {
      return NextResponse.json(
        {
          error: "Parent page ID manquant",
          help: "Ajoutez ?parent=341a7d274cf880b0ab50c5f76baf6f25 à l'URL",
        },
        { status: 400 }
      );
    }

    const results: Record<string, { pageId: string; label: string; status: string }> = {};

    for (const themeKey of THEME_KEYS) {
      const themeLabel = THEMES[themeKey].label;
      const cacheKey   = `NOTION_THEME_PAGE_${themeKey}`;

      try {
        // Vérifier si la page existe déjà en AppConfig
        const stored = await prisma.appConfig.findUnique({ where: { key: cacheKey } });

        if (stored?.value) {
          results[themeKey] = { pageId: stored.value, label: themeLabel, status: "déjà existante" };
          continue;
        }

        // Créer la page
        const pageId = await ensureThemePage(parentPageId, themeKey, themeLabel);
        await prisma.appConfig.upsert({
          where:  { key: cacheKey },
          update: { value: pageId },
          create: { key: cacheKey, value: pageId },
        });

        results[themeKey] = { pageId, label: themeLabel, status: "créée ✅" };

        // Petite pause pour respecter la limite Notion
        await new Promise((r) => setTimeout(r, 350));

      } catch (err) {
        results[themeKey] = {
          pageId: "",
          label: themeLabel,
          status: `erreur: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // Créer aussi la page "Tous les thèmes"
    try {
      const cacheKey = "NOTION_THEME_PAGE_TOUS";
      const stored   = await prisma.appConfig.findUnique({ where: { key: cacheKey } });
      if (!stored?.value) {
        const pageId = await ensureThemePage(parentPageId, "TOUS", "Tous les thèmes");
        await prisma.appConfig.upsert({
          where:  { key: cacheKey },
          update: { value: pageId },
          create: { key: cacheKey, value: pageId },
        });
        results["TOUS"] = { pageId, label: "Tous les thèmes", status: "créée ✅" };
      } else {
        results["TOUS"] = { pageId: stored.value, label: "Tous les thèmes", status: "déjà existante" };
      }
    } catch (err) {
      results["TOUS"] = {
        pageId: "",
        label: "Tous les thèmes",
        status: `erreur: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    const created = Object.values(results).filter((r) => r.status.includes("créée")).length;
    const existing = Object.values(results).filter((r) => r.status.includes("déjà")).length;
    const errors   = Object.values(results).filter((r) => r.status.includes("erreur")).length;

    return NextResponse.json({
      success: true,
      summary: `${created} pages créées, ${existing} déjà existantes, ${errors} erreurs`,
      parentPageId,
      pages: results,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
