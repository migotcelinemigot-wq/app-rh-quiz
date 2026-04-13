import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { THEMES, THEME_KEYS } from "@/lib/themes";

export async function GET() {
  try {
    const scores = await prisma.competencyScore.findMany();

    // Retourner tous les thèmes, même ceux sans score
    const result = THEME_KEYS.map((key) => {
      const found = scores.find((s) => s.theme === key);
      return {
        theme: key,
        label: THEMES[key].label,
        color: THEMES[key].color,
        score: found?.score ?? 0,
        totalAnswers: found?.totalAnswers ?? 0,
        correct: found?.correct ?? 0,
        lastUpdated: found?.lastUpdated ?? null,
      };
    });

    const totalAnswers = scores.reduce((a, s) => a + s.totalAnswers, 0);
    const totalCorrect = scores.reduce((a, s) => a + s.correct, 0);
    const globalScore = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

    return NextResponse.json({ scores: result, globalScore, totalAnswers });
  } catch (error) {
    console.error("Erreur compétences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
