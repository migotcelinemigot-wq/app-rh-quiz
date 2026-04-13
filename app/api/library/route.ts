import { NextRequest, NextResponse } from "next/server";
import { getQuestionsFromNotion } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import type { ThemeKey } from "@/lib/themes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme") as ThemeKey | null;
    const difficulty = searchParams.get("difficulty")
      ? Number(searchParams.get("difficulty"))
      : undefined;
    const limit = Number(searchParams.get("limit") ?? "50");

    // Récupérer l'ID de la BDD Notion
    const config = await prisma.appConfig.findUnique({
      where: { key: "NOTION_QUESTIONS_DB_ID" },
    });
    const dbId = config?.value ?? process.env.NOTION_QUESTIONS_DB_ID;
    if (!dbId) {
      return NextResponse.json({ questions: [] });
    }

    const questions = await getQuestionsFromNotion(
      dbId,
      theme ?? undefined,
      difficulty,
      limit
    );

    return NextResponse.json({ questions, count: questions.length });
  } catch (error) {
    console.error("Erreur bibliothèque:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
