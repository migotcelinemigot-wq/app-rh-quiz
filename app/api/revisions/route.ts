import { NextRequest, NextResponse } from "next/server";
import { createRevisionSheet } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { theme } = (await req.json()) as { theme: ThemeKey };

    const parentPageId =
      process.env.NOTION_REVISIONS_PAGE_ID ??
      process.env.NOTION_PARENT_PAGE_ID;

    if (!parentPageId) {
      return NextResponse.json(
        { error: "NOTION_PARENT_PAGE_ID manquant" },
        { status: 400 }
      );
    }

    // Récupérer les questions ratées pour ce thème
    const wrongAnswers = await prisma.quizAnswer.findMany({
      where: { isCorrect: false, session: { theme } },
      take: 10,
      orderBy: { id: "desc" },
    });

    const score = await prisma.competencyScore.findUnique({
      where: { theme },
    });

    const weakQuestions = wrongAnswers.map((a) => ({
      question: a.questionText,
      explanation: "",
      source: "",
    }));

    const pageId = await createRevisionSheet(
      theme,
      THEMES[theme]?.label ?? theme,
      score?.score ?? 0,
      weakQuestions,
      parentPageId
    );

    return NextResponse.json({ pageId });
  } catch (error) {
    console.error("Erreur création fiche révision:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
