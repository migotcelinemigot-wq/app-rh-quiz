import { Client } from "@notionhq/client";
import type { ThemeKey } from "./themes";
import { THEMES } from "./themes";
import type { QuestionType } from "./claude";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionQuestion {
  id: string;
  question: string;
  theme: ThemeKey;
  type?: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
  difficulty: number;
  createdAt: string;
}

// ─── Labels français ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<QuestionType, string> = {
  QCM:              "QCM",
  VRAI_FAUX:        "Vrai / Faux",
  DEFINITION:       "Définition",
  MISE_EN_SITUATION:"Mise en situation",
  CLASSEMENT:       "Classement",
  PRIORITE:         "Priorité",
  TEXTE_A_TROUS:    "Texte à trous",
};

const TYPE_EMOJIS: Record<QuestionType, string> = {
  QCM:              "🔘",
  VRAI_FAUX:        "✅",
  DEFINITION:       "📖",
  MISE_EN_SITUATION:"💼",
  CLASSEMENT:       "🔢",
  PRIORITE:         "🎯",
  TEXTE_A_TROUS:    "✏️",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tronquer un texte à 2000 caractères (limite Notion rich_text) */
function truncate(text: string, max = 1990): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/** Extraire les 3 blocs d'explication (📌 💡 ⚠️) */
function parseExplanation(explanation: string) {
  const defMatch = explanation.match(/📌\s*Définition\s*:\s*([\s\S]*?)(?=💡|⚠️|$)/);
  const exMatch  = explanation.match(/💡\s*Exemple(?:\s*concret)?\s*:\s*([\s\S]*?)(?=📌|⚠️|$)/);
  const ceMatch  = explanation.match(/⚠️\s*Contre-exemple\s*:\s*([\s\S]*?)(?=📌|💡|$)/);

  return {
    definition:    defMatch?.[1]?.trim() ?? null,
    exemple:       exMatch?.[1]?.trim()  ?? null,
    contreExemple: ceMatch?.[1]?.trim()  ?? null,
    rawText:       explanation,
    isStructured:  !!(defMatch || exMatch || ceMatch),
  };
}

/** Extraire la lettre d'une option : "A. texte" → "A" */
function getOptionLetter(option: string, index: number): string {
  return option.match(/^([A-D])\./)?.[1] ?? String.fromCharCode(65 + index);
}

// ─── Construire le contenu de la page ─────────────────────────────────────────

function buildPageBlocks(q: {
  type?: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
}) {
  const blocks: object[] = [];
  const qType = q.type as QuestionType | undefined;
  const typeLabel = qType ? TYPE_LABELS[qType] : "Question";
  const typeEmoji = qType ? TYPE_EMOJIS[qType] : "❓";
  const isVraiFaux   = q.type === "VRAI_FAUX";
  const isClassement = q.type === "CLASSEMENT";

  // ── En-tête type de question ────────────────────────────────────────────────
  blocks.push({
    object: "block",
    type: "callout",
    callout: {
      rich_text: [{ type: "text", text: { content: truncate(q.question) } }],
      icon: { type: "emoji", emoji: typeEmoji },
      color: "gray_background",
    },
  });

  // ── Options ─────────────────────────────────────────────────────────────────
  blocks.push({
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: `📝 Options — ${typeLabel}` } }],
      color: "default",
    },
  });

  if (isVraiFaux) {
    // Vrai / Faux
    for (const opt of ["Vrai", "Faux"]) {
      const isCorrect = opt === q.answer;
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{
            type: "text",
            text: { content: isCorrect ? `✅ ${opt}  ← bonne réponse` : `❌ ${opt}` },
            annotations: { bold: isCorrect, color: isCorrect ? "green" : "red" },
          }],
        },
      });
    }
  } else if (isClassement) {
    // Classement — afficher les items ET l'ordre correct
    const correctOrder = q.answer.split(",").map(s => s.trim());
    q.options.forEach((opt, i) => {
      const letter = getOptionLetter(opt, i);
      const rank   = correctOrder.indexOf(letter) + 1;
      const text   = opt.replace(/^[A-D]\.\s*/, "");
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{
            type: "text",
            text: { content: `${letter}. ${text}  →  position ${rank > 0 ? rank : "?"}` },
            annotations: { bold: true, color: "blue" },
          }],
        },
      });
    });
    // Ligne récapitulative
    const orderedLabels = correctOrder
      .map(l => {
        const opt = q.options.find(o => getOptionLetter(o, 0) === l) ?? l;
        return opt.replace(/^[A-D]\.\s*/, "");
      })
      .join(" → ");
    blocks.push({
      object: "block",
      type: "callout",
      callout: {
        rich_text: [{ type: "text", text: { content: `Ordre correct : ${truncate(orderedLabels, 300)}` } }],
        icon: { type: "emoji", emoji: "🔢" },
        color: "blue_background",
      },
    });
  } else {
    // QCM standard (DEFINITION, MISE_EN_SITUATION, PRIORITE, TEXTE_A_TROUS)
    q.options.forEach((opt, i) => {
      const letter    = getOptionLetter(opt, i);
      const isCorrect = letter === q.answer;
      const text      = opt.replace(/^[A-D]\.\s*/, "");
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{
            type: "text",
            text: {
              content: isCorrect
                ? `✅ ${letter}. ${text}  ← bonne réponse`
                : `${letter}. ${text}`,
            },
            annotations: {
              bold:  isCorrect,
              color: isCorrect ? "green" : "default",
            },
          }],
        },
      });
    });
  }

  // ── Divider ─────────────────────────────────────────────────────────────────
  blocks.push({ object: "block", type: "divider", divider: {} });

  // ── Explication ─────────────────────────────────────────────────────────────
  blocks.push({
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: "💬 Explication" } }],
    },
  });

  const expl = parseExplanation(q.explanation);

  if (expl.isStructured) {
    if (expl.definition) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: truncate(expl.definition) } }],
          icon: { type: "emoji", emoji: "📌" },
          color: "blue_background",
        },
      });
    }
    if (expl.exemple) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: truncate(expl.exemple) } }],
          icon: { type: "emoji", emoji: "💡" },
          color: "green_background",
        },
      });
    }
    if (expl.contreExemple) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: truncate(expl.contreExemple) } }],
          icon: { type: "emoji", emoji: "⚠️" },
          color: "orange_background",
        },
      });
    }
  } else {
    // Fallback : texte brut
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: truncate(q.explanation) } }],
      },
    });
  }

  // ── Source ──────────────────────────────────────────────────────────────────
  if (q.source) {
    blocks.push({ object: "block", type: "divider", divider: {} });
    blocks.push({
      object: "block",
      type: "quote",
      quote: {
        rich_text: [{
          type: "text",
          text: { content: `📎 ${truncate(q.source, 400)}` },
          annotations: { color: "gray" },
        }],
      },
    });
  }

  return blocks;
}

// ─── Initialisation de la base de données Notion ──────────────────────────────

export async function ensureQuestionsDatabase(): Promise<string> {
  const existingId = process.env.NOTION_QUESTIONS_DB_ID;
  if (existingId) return existingId;

  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
  if (!parentPageId) throw new Error("NOTION_PARENT_PAGE_ID manquant dans .env.local");

  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "📚 Questions RH" } }],
    properties: {
      Question:   { title: {} },
      Thème:      {
        select: {
          options: [
            { name: "Droit du travail",           color: "purple" },
            { name: "Paie & rémunération",         color: "green"  },
            { name: "Recrutement & GPEC",          color: "yellow" },
            { name: "Relations sociales",          color: "red"    },
            { name: "Délais légaux",               color: "blue"   },
            { name: "Avantages & bénéfices",       color: "pink"   },
            { name: "Convention Publicité 0086",   color: "gray"   },
            { name: "Gestion de la performance",   color: "orange" },
            { name: "Formation & compétences",     color: "green"  },
            { name: "Gestion des talents",         color: "purple" },
            { name: "Administration RH",           color: "gray"   },
            { name: "Politique de rémunération",   color: "yellow" },
            { name: "Stratégie RH",                color: "blue"   },
            { name: "QVT & diversité",             color: "pink"   },
            { name: "Santé & sécurité",            color: "orange" },
            { name: "SIRH & digital RH",           color: "blue"   },
            { name: "Tous les thèmes",             color: "default"},
          ],
        },
      },
      Type:       {
        select: {
          options: [
            { name: "QCM",              color: "blue"   },
            { name: "Vrai / Faux",      color: "yellow" },
            { name: "Définition",       color: "green"  },
            { name: "Mise en situation",color: "purple" },
            { name: "Classement",       color: "gray"   },
            { name: "Priorité",         color: "red"    },
            { name: "Texte à trous",    color: "pink"   },
          ],
        },
      },
      Réponse:    {
        select: {
          options: [
            { name: "A",    color: "blue"   },
            { name: "B",    color: "green"  },
            { name: "C",    color: "yellow" },
            { name: "D",    color: "red"    },
            { name: "Vrai", color: "green"  },
            { name: "Faux", color: "red"    },
          ],
        },
      },
      Difficulté: {
        select: {
          options: [
            { name: "Facile",    color: "green"  },
            { name: "Moyen",     color: "yellow" },
            { name: "Difficile", color: "red"    },
          ],
        },
      },
      Source:     { rich_text: {} },
      "Créé le":  { date: {} },
    },
  });

  return db.id;
}

// ─── Mettre à jour le schéma si nécessaire (ajouter Type) ────────────────────

async function ensureTypeProperty(dbId: string) {
  try {
    const db = await notion.databases.retrieve({ database_id: dbId });
    if (!("Type" in db.properties)) {
      await notion.databases.update({
        database_id: dbId,
        properties: {
          Type: {
            select: {
              options: [
                { name: "QCM",              color: "blue"   },
                { name: "Vrai / Faux",      color: "yellow" },
                { name: "Définition",       color: "green"  },
                { name: "Mise en situation",color: "purple" },
                { name: "Classement",       color: "gray"   },
                { name: "Priorité",         color: "red"    },
                { name: "Texte à trous",    color: "pink"   },
              ],
            },
          },
        },
      });
    }
  } catch {
    // Non bloquant si échec
  }
}

// ─── Sauvegarder des questions dans Notion ────────────────────────────────────

export async function saveQuestionsToNotion(
  questions: (Omit<NotionQuestion, "id" | "createdAt"> & { type?: string })[],
  dbId: string
): Promise<NotionQuestion[]> {
  // S'assurer que la propriété Type existe dans la DB
  await ensureTypeProperty(dbId);

  const results: NotionQuestion[] = [];
  const themeToLabel = Object.fromEntries(
    Object.entries(THEMES).map(([k, v]) => [k, v.label])
  );

  // Sauvegarder par lots de 3 (limite Notion : 3 req/sec)
  for (let i = 0; i < questions.length; i += 3) {
    const batch = questions.slice(i, i + 3);
    const batchResults = await Promise.all(
      batch.map(async (q) => {
        const difficultyLabel = q.difficulty === 1 ? "Facile" : q.difficulty === 3 ? "Difficile" : "Moyen";
        const themeLabel      = themeToLabel[q.theme] ?? q.theme;
        const qType           = q.type as QuestionType | undefined;
        const typeLabel       = qType ? TYPE_LABELS[qType] : undefined;

        // Réponse : tronquer si CLASSEMENT (ex: "A,C,B,D")
        const answerDisplay = q.answer.length > 10 ? q.answer.slice(0, 10) : q.answer;
        // Pour CLASSEMENT l'answer n'est pas dans les options select de Réponse
        const isSelectableAnswer = ["A","B","C","D","Vrai","Faux"].includes(q.answer);

        const page = await notion.pages.create({
          parent: { database_id: dbId },
          properties: {
            Question:   { title: [{ text: { content: truncate(q.question, 500) } }] },
            Thème:      { select: { name: themeLabel } },
            ...(typeLabel ? { Type: { select: { name: typeLabel } } } : {}),
            ...(isSelectableAnswer ? { Réponse: { select: { name: q.answer } } } : {}),
            Difficulté: { select: { name: difficultyLabel } },
            Source:     { rich_text: [{ text: { content: truncate(q.source || "", 400) } }] },
            "Créé le":  { date: { start: new Date().toISOString() } },
          },
          // ── Contenu enrichi de la page ──
          children: buildPageBlocks(q) as Parameters<typeof notion.pages.create>[0]["children"],
        });

        return {
          ...q,
          id: page.id,
          createdAt: new Date().toISOString(),
        } as NotionQuestion;
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
    const label = THEMES[theme]?.label ?? theme;
    filters.push({ property: "Thème", select: { equals: label } });
  }
  if (difficulty) {
    const label = difficulty === 1 ? "Facile" : difficulty === 3 ? "Difficile" : "Moyen";
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
        p.type === "rich_text" ? ((p.rich_text as { plain_text: string }[])[0]?.plain_text ?? "") : "";

      const getSelect = (p: { type: string } & Record<string, unknown>) =>
        p.type === "select" ? ((p.select as { name: string } | null)?.name ?? "") : "";

      // Retrouver la ThemeKey depuis le label français
      const themeLabel = getSelect(props["Thème"]);
      const themeKey   = (Object.entries(THEMES).find(([, v]) => v.label === themeLabel)?.[0]
        ?? themeLabel) as ThemeKey;

      const diffLabel  = getSelect(props["Difficulté"]);
      const difficulty = diffLabel === "Facile" ? 1 : diffLabel === "Difficile" ? 3 : 2;

      return {
        id: page.id,
        question:    getTitle(props["Question"]),
        theme:       themeKey,
        type:        getSelect(props["Type"]) || undefined,
        options:     [],   // les options sont dans le corps de la page
        answer:      getSelect(props["Réponse"]),
        explanation: "",   // dans le corps de la page
        source:      getRichText(props["Source"]),
        difficulty,
        createdAt:   "created_time" in page ? (page.created_time as string) : new Date().toISOString(),
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
      title: [{ text: { content: `📋 Fiche révision — ${themeLabel} (${Math.round(score)}%)` } }],
    },
    children: [
      {
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ text: { content: `Score actuel : ${Math.round(score)}% — Des révisions s'imposent sur ce thème.` } }],
          icon: { type: "emoji", emoji: "⚠️" },
          color: "yellow_background",
        },
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ text: { content: "Questions à retravailler" } }] },
      },
      ...weakQuestions.flatMap((q) => [
        {
          object: "block" as const,
          type: "heading_3" as const,
          heading_3: { rich_text: [{ text: { content: truncate(q.question, 300) } }] },
        },
        {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: { rich_text: [{ text: { content: truncate(q.explanation) } }] },
        },
        ...(q.source ? [{
          object: "block" as const,
          type: "quote" as const,
          quote: { rich_text: [{ text: { content: `📎 ${q.source}` } }] },
        }] : []),
      ]),
    ],
  });

  return page.id;
}
