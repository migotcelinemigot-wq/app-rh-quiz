import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await prisma.quizSession.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: { answers: true },
    });
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Erreur récupération sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, totalQuestions, correctAnswers, durationSec, answers } =
      body as {
        theme: string;
        totalQuestions: number;
        correctAnswers: number;
        durationSec: number;
        answers: {
          notionQuestionId: string;
          questionText: string;
          options?: string[];
          type?: string;
          userAnswer: string;
          correctAnswer: string;
          isCorrect: boolean;
          timeSpent: number;
        }[];
      };

    const session = await prisma.quizSession.create({
      data: {
        theme,
        totalQuestions,
        correctAnswers,
        durationSec,
        answers: {
          create: answers.map((a) => ({
            ...a,
            options: JSON.stringify(a.options ?? []),
            type: a.type ?? "QCM",
          })),
        },
      },
      include: { answers: true },
    });

    // Mettre à jour le score de compétence pour ce thème
    const existing = await prisma.competencyScore.findUnique({
      where: { theme },
    });

    if (existing) {
      const newTotal = existing.totalAnswers + totalQuestions;
      const newCorrect = existing.correct + correctAnswers;
      await prisma.competencyScore.update({
        where: { theme },
        data: {
          totalAnswers: newTotal,
          correct: newCorrect,
          score: (newCorrect / newTotal) * 100,
          lastUpdated: new Date(),
        },
      });
    } else {
      await prisma.competencyScore.create({
        data: {
          theme,
          totalAnswers: totalQuestions,
          correct: correctAnswers,
          score: (correctAnswers / totalQuestions) * 100,
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Erreur création session:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
