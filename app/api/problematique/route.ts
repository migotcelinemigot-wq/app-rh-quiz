import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { THEMES, THEME_CONTEXT } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { theme, problematique } = await req.json() as {
      theme?: ThemeKey;
      problematique: string;
    };

    const themeContext = theme
      ? `Contexte thématique : ${THEMES[theme].label} — ${THEME_CONTEXT[theme]}`
      : "";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en droit du travail français, spécialisé dans la convention collective 0086 (Publicité) et les ressources humaines.
Tu réponds aux problématiques RH de manière précise, pratique et juridiquement fondée.
Tu cites toujours les articles de loi ou de la CC 0086 pertinents.
Tu structures ta réponse clairement : analyse de la situation, obligations légales, recommandations concrètes.`,
        },
        {
          role: "user",
          content: `Voici ma problématique RH :

${problematique}

${themeContext}

Analyse cette situation et donne-moi :
1. Une analyse claire de la situation juridique
2. Mes obligations légales et délais à respecter
3. Des recommandations concrètes et actionnables
4. Les risques à éviter
5. Les références légales applicables (Code du travail, CC 0086 si pertinent)`,
        },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Erreur problématique:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
