import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Client } from "@notionhq/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const notion = new Client({ auth: process.env.NOTION_API_KEY });

export interface VeilleItem {
  id: string;
  titre: string;
  resume: string;
  impact: string;       // Impact concret pour le RH
  source: string;       // Référence légale ou organisme
  theme: string;
  urgence: "haute" | "moyenne" | "info";
  lien?: string;        // URL vers l'article ou la recherche
}

function buildVeilleUrl(item: { titre: string; source: string; theme: string }): string {
  const src = item.source.toLowerCase();
  if (src.includes("urssaf")) {
    return `https://www.urssaf.fr/recherche?q=${encodeURIComponent(item.titre)}`;
  }
  if (src.includes("légifrance") || src.includes("legifrance") || src.includes("art.") || src.includes("code du travail")) {
    return `https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=${encodeURIComponent(item.titre)}&page=1&pageSize=10`;
  }
  // Google Actualités France par défaut
  return `https://news.google.com/search?q=${encodeURIComponent(item.titre + " " + item.theme)}&hl=fr&gl=FR&ceid=FR:fr`;
}

// Générer les infos de veille via Groq
export async function GET() {
  try {
    const today = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `Tu es expert RH français, CC 0086. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`,
        },
        {
          role: "user",
          content: `Génère 6 actualités RH pour le ${today}. Thèmes variés : droit travail, paie, CC 0086, URSSAF, retraite, congés.

JSON uniquement :
[{"id":"1","titre":"Titre accrocheur","resume":"2-3 phrases","impact":"1 phrase concrète","source":"Art. L... / CC 0086","theme":"Paie","urgence":"haute"}]

Urgences : "haute", "moyenne", "info".`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("JSON invalide");

    const rawItems: VeilleItem[] = JSON.parse(match[0]);
    // Enrichir chaque item avec un lien de lecture
    const items: VeilleItem[] = rawItems.map((item) => ({
      ...item,
      lien: item.lien || buildVeilleUrl(item),
    }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Erreur veille:", error);
    return NextResponse.json({ error: "Erreur génération" }, { status: 500 });
  }
}

// Sauvegarder un item dans Notion
export async function POST(req: NextRequest) {
  try {
    const { item } = await req.json() as { item: VeilleItem };

    // Récupérer l'ID de la page de veille Notion
    let veillePageId = process.env.NOTION_VEILLE_PAGE_ID;
    if (!veillePageId) {
      const config = await prisma.appConfig.findUnique({ where: { key: "NOTION_VEILLE_DB_ID" } });
      veillePageId = config?.value;
    }

    if (!veillePageId) {
      // Créer la base de données Veille si elle n'existe pas
      const parentPageId = process.env.NOTION_PARENT_PAGE_ID!;
      const db = await notion.databases.create({
        parent: { type: "page_id", page_id: parentPageId },
        title: [{ type: "text", text: { content: "Veille RH" } }],
        properties: {
          Titre: { title: {} },
          Thème: { rich_text: {} },
          Résumé: { rich_text: {} },
          Impact: { rich_text: {} },
          Source: { rich_text: {} },
          Lien: { url: {} },
          Urgence: {
            select: {
              options: [
                { name: "🔴 Haute", color: "red" },
                { name: "🟡 Moyenne", color: "yellow" },
                { name: "🔵 Info", color: "blue" },
              ],
            },
          },
          "Sauvegardé le": { date: {} },
        },
      });
      veillePageId = db.id;
      await prisma.appConfig.upsert({
        where: { key: "NOTION_VEILLE_DB_ID" },
        update: { value: db.id },
        create: { key: "NOTION_VEILLE_DB_ID", value: db.id },
      });
    }

    const urgenceLabel =
      item.urgence === "haute" ? "🔴 Haute" :
      item.urgence === "moyenne" ? "🟡 Moyenne" : "🔵 Info";

    const lien = item.lien || buildVeilleUrl(item);

    await notion.pages.create({
      parent: { database_id: veillePageId },
      properties: {
        Titre: { title: [{ text: { content: item.titre } }] },
        Thème: { rich_text: [{ text: { content: item.theme } }] },
        Résumé: { rich_text: [{ text: { content: item.resume } }] },
        Impact: { rich_text: [{ text: { content: item.impact } }] },
        Source: { rich_text: [{ text: { content: item.source } }] },
        Lien: { url: lien },
        Urgence: { select: { name: urgenceLabel } },
        "Sauvegardé le": { date: { start: new Date().toISOString() } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur sauvegarde veille:", error);
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}
