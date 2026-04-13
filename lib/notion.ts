import { Client } from "@notionhq/client";
import type { ThemeKey } from "./themes";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionQuestion {
  id: string;
  question: string;
  theme: ThemeKey;
  options: string[]; // ["A. ...", "B. ...", "C. ...", "D. ..."]
  answer: string;    // "A", "B", "C" ou "D"
  explanation: string;
  source: string;
  difficulty: number; // 1, 2 ou 3
  createdAt: string;
}

// ─── Initialisation de la base de données Notion ──────────────────────────────

export async function ensureQuestionsDatabase(): Promise<string> {
  const existingId = process.env.NOTION_QUESTIONS_DB_ID;
  if (existingId) return existingId;

  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
  if (!parentPageId) throw new Error("NOTION_PARENT_PAGE_ID manquant dans .env.local");

  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "Questions RH" } }],
    properties: {
      Question: { title: {} },
      Thème: {
        select: {
          options: [
            { name: "DROIT_TRAVAIL", color: "purple" },
            { name: "PAIE", color: "green" },
            { name: "RECRUTEMENT", color: "yellow" },
            { name: "RELATIONS_SOCIALES", color: "red" },
            { name: "DELAIS", color: "blue" },
            { name: "AVANTAGES", color: "pink" },
            { name: "CC_0086", color: "gray" },
          ],
        },
      },
      Options: { rich_text: {} },
      Réponse: {
        select: {
          options: [
            { name: "A", color: "blue" },
            { name: "B", color: "green" },
            { name: "C", color: "yellow" },
            { name: "D", color: "red" },
          ],
        },
      },
      Explication: { rich_text: {} },
      Source: { rich_text: {} },
      Difficulté: {
        select: {
          options: [
            { name: "Facile", color: "green" },
            { name: "Moyen", color: "yellow" },
            { name: "Difficile", color: "red" },
          ],
        },
      },
      "Créé le": { date: {} },
    },
  });

  return db.id;
}

// ─── Sauvegarder des questions dans Notion ────────────────────────────────────

export async function saveQuestionsToNotion(
  questions: Omit<NotionQuestion, "id" | "createdAt">[],
  dbId: string
): Promise<NotionQuestion[]> {
  const results: NotionQuestion[] = [];

  // Sauvegarder par lots de 3 pour respecter la limite Notion (3 req/sec)
  for (let i = 0; i < questions.length; i += 3) {
    const batch = questions.slice(i, i + 3);
    const batchResults = await Promise.all(
      batch.map(async (q) => {
        const difficultyLabel =
          q.difficulty === 1 ? "Facile" : q.difficulty === 3 ? "Difficile" : "Moyen";

        const page = await notion.pages.create({
          parent: { database_id: dbId },
          properties: {
            Question: { title: [{ text: { content: q.question } }] },
            Thème: { select: { name: q.theme } },
            Options: { rich_text: [{ text: { content: JSON.stringify(q.options) } }] },
            Réponse: { select: { name: q.answer } },
            Explication: { rich_text: [{ text: { content: q.explanation } }] },
            Source: { rich_text: [{ text: { content: q.source || "" } }] },
            Difficulté: { select: { name: difficultyLabel } },
            "Créé le": { date: { start: new Date().toISOString() } },
          },
        });

        return { ...q, id: page.id, createdAt: new Date().toISOString() } as NotionQuestion;
      })
    );
    results.push(...batchResults);
  }

  return results;
}

// ─── Lire des questions depuis Notion ────────────────────────────────────────

export async function getQuestionsFromNotion(
  dbId: string,
  theme?: ThemeKey,
  difficulty?: number,
  limit = 50
): Promise<NotionQuestion[]> {
  const filters: Parameters<typeof notion.databases.query>[0]["filter"][] = [];

  if (theme) {
    filters.push({ property: "Thème", select: { equals: theme } });
  }
  if (difficulty) {
    const label =
      difficulty === 1 ? "Facile" : difficulty === 3 ? "Difficile" : "Moyen";
    filters.push({ property: "Difficulté", select: { equals: label } });
  }

  const response = await notion.databases.query({
    database_id: dbId,
    filter:
      filters.length === 0
        ? undefined
        : filters.length === 1
        ? filters[0]
        : { and: filters },
    page_size: limit,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return response.results
    .filter((p): p is Extract<typeof p, { properties: unknown }> => "properties" in p)
    .map((page) => {
      const props = page.properties as Record<string, { type: string } & Record<string, unknown>>;

      const getTitle = (p: { type: string } & Record<string, unknown>) =>
        p.type === "title" ? ((p.title as { plain_text: string }[])[0]?.plain_text ?? "") : "";

      const getRichText = (p: { type: string } & Record<string, unknown>) =>
        p.type === "rich_text"
          ? ((p.rich_text as { plain_text: string }[])[0]?.plain_text ?? "")
          : "";

      const getSelect = (p: { type: string } & Record<string, unknown>) =>
        p.type === "select" ? ((p.select as { name: string } | null)?.name ?? "") : "";

      const optionsRaw = getRichText(props["Options"]);
      let options: string[] = [];
      try {
        options = JSON.parse(optionsRaw);
      } catch {
        options = [];
      }

      const diffLabel = getSelect(props["Difficulté"]);
      const difficulty =
        diffLabel === "Facile" ? 1 : diffLabel === "Difficile" ? 3 : 2;

      return {
        id: page.id,
        question: getTitle(props["Question"]),
        theme: getSelect(props["Thème"]) as ThemeKey,
        options,
        answer: getSelect(props["Réponse"]),
        explanation: getRichText(props["Explication"]),
        source: getRichText(props["Source"]),
        difficulty,
        createdAt:
          "created_time" in page ? (page.created_time as string) : new Date().toISOString(),
      };
    });
}

// ─── Créer une fiche de révision dans Notion ─────────────────────────────────

export async function createRevisionSheet(
  theme: string,
  themeLabel: string,
  score: number,
  weakQuestions: { question: string; explanation: string; source: string }[],
  parentPageId: string
): Promise<string> {
  const page = await notion.pages.create({
    parent: { type: "page_id", page_id: parentPageId },
    properties: {
      title: [
        {
          text: {
            content: `Fiche révision — ${themeLabel} (score: ${Math.round(score)}%)`,
          },
        },
      ],
    },
    children: [
      {
        object: "block",
        type: "callout",
        callout: {
          rich_text: [
            {
              text: {
                content: `Score actuel : ${Math.round(score)}% — Des révisions s'imposent sur ce thème.`,
              },
            },
          ],
          icon: { type: "emoji", emoji: "⚠️" },
          color: "yellow_background",
        },
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "Questions à retravailler" } }],
        },
      },
      ...weakQuestions.flatMap((q) => [
        {
          object: "block" as const,
          type: "heading_3" as const,
          heading_3: {
            rich_text: [{ text: { content: q.question } }],
          },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [{ text: { content: q.explanation } }],
          },
        },
        ...(q.source
          ? [
              {
                object: "block" as const,
                type: "quote" as const,
                quote: {
                  rich_text: [{ text: { content: `Référence : ${q.source}` } }],
                },
              },
            ]
          : []),
      ]),
    ],
  });

  return page.id;
}
