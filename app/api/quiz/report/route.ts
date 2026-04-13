import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { prisma } from "@/lib/prisma";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export interface QuestionReport {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  source: string;
  type: string;
  theme: string;
}

async function getOrCreateReportsDb(): Promise<string> {
  const config = await prisma.appConfig.findUnique({ where: { key: "NOTION_REPORTS_DB_ID" } });
  if (config?.value) return config.value;

  const parentPageId = process.env.NOTION_PARENT_PAGE_ID!;
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "⚠️ Signalements Quiz RH" } }],
    properties: {
      Question: { title: {} },
      Type: { rich_text: {} },
      Thème: { rich_text: {} },
      "Réponse de l'outil": { rich_text: {} },
      "Réponse de l'utilisatrice": { rich_text: {} },
      Explication: { rich_text: {} },
      Source: { rich_text: {} },
      Statut: {
        select: {
          options: [
            { name: "🔴 À vérifier", color: "red" },
            { name: "✅ Vérifié - correct", color: "green" },
            { name: "❌ Vérifié - erreur outil", color: "orange" },
          ],
        },
      },
      "Signalé le": { date: {} },
    },
  });

  await prisma.appConfig.upsert({
    where: { key: "NOTION_REPORTS_DB_ID" },
    update: { value: db.id },
    create: { key: "NOTION_REPORTS_DB_ID", value: db.id },
  });

  return db.id;
}

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json() as { report: QuestionReport };
    const dbId = await getOrCreateReportsDb();

    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Question:               { title: [{ text: { content: report.questionText.slice(0, 2000) } }] },
        Type:                   { rich_text: [{ text: { content: report.type } }] },
        Thème:                  { rich_text: [{ text: { content: report.theme } }] },
        "Réponse de l'outil":   { rich_text: [{ text: { content: report.correctAnswer } }] },
        "Réponse de l'utilisatrice": { rich_text: [{ text: { content: report.userAnswer } }] },
        Explication:            { rich_text: [{ text: { content: report.explanation.slice(0, 2000) } }] },
        Source:                 { rich_text: [{ text: { content: report.source } }] },
        Statut:                 { select: { name: "🔴 À vérifier" } },
        "Signalé le":           { date: { start: new Date().toISOString() } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur signalement:", error);
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}
