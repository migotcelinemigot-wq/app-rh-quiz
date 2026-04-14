import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "200");

    const wrongAnswers = await prisma.quizAnswer.findMany({
      where: {
        isCorrect: false,
        ...(theme ? { session: { theme } } : {}),
      },
      include: {
        session: { select: { theme: true, date: true } },
      },
      orderBy: { id: "desc" },
      take: limit,
    });

    // Dédoublonner par texte de question (garder la plus récente)
    const seen = new Set<string>();
    const unique = wrongAnswers.filter((a) => {
      const key = a.questionText.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Grouper par thème
    const grouped: Record<string, {
      theme: string;
      count: number;
      answers: {
        id: number;
        questionText: string;
        userAnswer: string;
        correctAnswer: string;
        date: string;
      }[];
    }> = {};

    for (const a of unique) {
      const t = a.session.theme;
      if (!grouped[t]) grouped[t] = { theme: t, count: 0, answers: [] };
      grouped[t].count++;
      grouped[t].answers.push({
        id: a.id,
        questionText: a.questionText,
        userAnswer: a.userAnswer,
        correctAnswer: a.correctAnswer,
        date: a.session.date.toISOString(),
      });
    }

    return NextResponse.json({
      total: unique.length,
      grouped: Object.values(grouped).sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    console.error("Erreur wrong-answers:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
