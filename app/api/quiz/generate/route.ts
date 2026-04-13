import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/claude";
import { saveQuestionsToNotion, ensureQuestionsDatabase } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import type { ThemeKey } from "@/lib/themes";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { theme, difficulty = 2, count = 10 } = body as {
      theme: ThemeKey;
      difficulty: 1 | 2 | 3;
      count: number;
    };

    if (!theme) {
      return NextResponse.json({ error: "Thème requis" }, { status: 400 });
    }

    // Générer les questions via Claude
    const generated = await generateQuestions(theme, difficulty, count);

    // Récupérer ou créer la base de données Notion
    let dbId = process.env.NOTION_QUESTIONS_DB_ID;
    if (!dbId) {
      dbId = await ensureQuestionsDatabase();
      // Sauvegarder l'ID en base pour future utilisation
      await prisma.appConfig.upsert({
        where: { key: "NOTION_QUESTIONS_DB_ID" },
        update: { value: dbId },
        create: { key: "NOTION_QUESTIONS_DB_ID", value: dbId },
      });
    }

    // Sauvegarder dans Notion
    const saved = await saveQuestionsToNotion(
      generated.map((q) => ({ ...q, theme, difficulty })),
      dbId
    );

    return NextResponse.json({ questions: saved, count: saved.length });
  } catch (error) {
    console.error("Erreur génération quiz:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des questions" },
      { status: 500 }
    );
  }
}
