import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureQuestionsDatabase } from "@/lib/notion";

export const dynamic = "force-dynamic";

/**
 * GET /api/notion/reset-db
 * Supprime l'ancien ID de base de données Questions RH et en crée une nouvelle.
 * À appeler une seule fois si la DB Notion n'est plus accessible.
 */
export async function GET() {
  try {
    // 1. Supprimer l'ancien ID en AppConfig
    const deleted = await prisma.appConfig.deleteMany({
      where: { key: "NOTION_QUESTIONS_DB_ID" },
    });

    // 2. Créer une nouvelle base de données sous NOTION_PARENT_PAGE_ID
    const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
    if (!parentPageId) {
      return NextResponse.json({
        error: "NOTION_PARENT_PAGE_ID manquant — impossible de créer la DB",
      }, { status: 400 });
    }

    const newDbId = await ensureQuestionsDatabase();

    // 3. Stocker le nouvel ID en AppConfig
    await prisma.appConfig.upsert({
      where:  { key: "NOTION_QUESTIONS_DB_ID" },
      update: { value: newDbId },
      create: { key: "NOTION_QUESTIONS_DB_ID", value: newDbId },
    });

    return NextResponse.json({
      success: true,
      oldEntriesDeleted: deleted.count,
      newDatabaseId: newDbId,
      message: "✅ Nouvelle base '📚 Questions RH' créée dans Notion. Lance un quiz pour tester !",
    });

  } catch (err) {
    return NextResponse.json({
      error: "Erreur lors du reset",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
