import Groq from "groq-sdk";
import type { ThemeKey } from "./themes";
import { THEMES, DIFFICULTIES } from "./themes";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type QuestionType = "QCM" | "VRAI_FAUX" | "DEFINITION" | "MISE_EN_SITUATION";

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options: string[];  // ["A. ...", "B. ...", ...] ou ["Vrai", "Faux"]
  answer: string;     // "A", "B", "C", "D", "Vrai" ou "Faux"
  explanation: string;
  source: string;
}

const THEME_CONTEXT: Record<ThemeKey, string> = {
  DROIT_TRAVAIL:
    "le droit du travail français : contrats de travail (CDI, CDD, intérim), période d'essai, rupture du contrat, licenciement, démission, congés payés, durée du travail, heures supplémentaires",
  PAIE:
    "la paie et la rémunération : calcul du salaire brut/net, cotisations sociales, primes légales et conventionnelles, avantages en nature, bulletin de paie, minimum conventionnel CC 0086",
  RECRUTEMENT:
    "le recrutement et la GPEC : processus de recrutement, fiches de poste, entretiens d'embauche, onboarding, gestion prévisionnelle des emplois et compétences, plan de formation",
  RELATIONS_SOCIALES:
    "les relations sociales en entreprise : Comité Social et Économique (CSE), délégués syndicaux, négociation collective, accords d'entreprise, procédures disciplinaires, harcèlement",
  DELAIS:
    "les délais légaux RH : préavis de licenciement et démission, délais de prescription des actions prud'homales, délais de réponse aux courriers recommandés, délais de convocation",
  AVANTAGES:
    "les avantages et bénéfices salariaux : tickets restaurant, mutuelle obligatoire, prévoyance, intéressement, participation, PEE/PERCO, chèques cadeaux (limites CSE), avantages en nature (véhicule, logement, téléphone)",
  CC_0086:
    "la convention collective nationale 0086 (Publicité) : champ d'application, classifications et grilles de salaires, avantages spécifiques, congés supplémentaires, clauses particulières du secteur Publicité, IDCC 0086",
};

const TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  QCM: `Question à choix multiple avec 4 options (A, B, C, D). Une seule bonne réponse.
Format : { "type": "QCM", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B", "explanation": "...", "source": "..." }`,

  VRAI_FAUX: `Affirmation à valider (Vrai ou Faux). L'affirmation doit être précise et sourcée.
Format : { "type": "VRAI_FAUX", "question": "Affirmation à évaluer", "options": ["Vrai", "Faux"], "answer": "Vrai", "explanation": "...", "source": "..." }`,

  DEFINITION: `Donner la définition d'un terme RH/juridique parmi 4 propositions.
Format : { "type": "DEFINITION", "question": "Qu'est-ce que [terme] ?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "source": "..." }`,

  MISE_EN_SITUATION: `Scénario concret RH (réel ou fictif) : décrire une situation et demander la bonne réaction légale.
Format : { "type": "MISE_EN_SITUATION", "question": "Situation : [description]. Que devez-vous faire ?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "C", "explanation": "...", "source": "..." }`,
};

export async function generateQuestions(
  theme: ThemeKey | "TOUS",
  difficulty: 1 | 2 | 3,
  count: number
): Promise<GeneratedQuestion[]> {
  const themeLabel = theme === "TOUS"
    ? "tous les thèmes RH (droit du travail, paie, recrutement, relations sociales, délais, avantages, CC 0086)"
    : THEMES[theme].label;

  const themeContext = theme === "TOUS"
    ? Object.values(THEME_CONTEXT).join("; ")
    : THEME_CONTEXT[theme];

  const difficultyLabel = DIFFICULTIES[difficulty].label.toLowerCase();

  // Répartir les types de questions équitablement
  const types: QuestionType[] = ["QCM", "VRAI_FAUX", "DEFINITION", "MISE_EN_SITUATION"];
  const typeDistribution = types
    .flatMap((t, i) => Array(Math.ceil(count / 4)).fill(t))
    .slice(0, count);

  const typeSummary = typeDistribution
    .reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);

  const typeInstructions = Object.entries(typeSummary)
    .map(([t, n]) => `- ${n} question(s) de type ${t} :\n  ${TYPE_INSTRUCTIONS[t as QuestionType]}`)
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Tu es un expert en droit du travail français et en ressources humaines, spécialisé dans la convention collective 0086 (Publicité).
Tu génères des questions de formation variées et pédagogiques pour un professionnel RH.
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après.`,
      },
      {
        role: "user",
        content: `Génère exactement ${count} question(s) de niveau ${difficultyLabel} sur : ${themeLabel}.

Contexte : ${themeContext}

Répartition des types à respecter :
${typeInstructions}

Règles :
- Les questions doivent être variées et ne pas se répéter
- Les explications doivent être pédagogiques (minimum 2 phrases)
- Citer les articles de loi ou de la CC 0086 quand c'est possible
- Les mises en situation doivent être réalistes et ancrées dans le quotidien RH

Réponds avec un tableau JSON contenant exactement ${count} objets (rien d'autre).`,
      },
    ],
    temperature: 0.8,
    max_tokens: 6000,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Format JSON invalide");

  const questions: GeneratedQuestion[] = JSON.parse(match[0]);
  if (!Array.isArray(questions)) throw new Error("Format JSON invalide");

  return questions.slice(0, count);
}

export async function generateOptimisationTips(
  category: "juridique" | "processus" | "les deux",
  theme?: ThemeKey
): Promise<string> {
  const themeContext = theme ? `Thème spécifique : ${THEMES[theme].label} — ${THEME_CONTEXT[theme]}` : "Tous les thèmes RH";

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `En tant qu'expert RH et juriste spécialisé en droit du travail français et convention collective 0086 (Publicité), propose des optimisations originales et concrètes.

${themeContext}
Catégorie : ${category === "juridique" ? "Optimisation juridique et paie (réduire les charges, maximiser les avantages légaux, astuces CC 0086)" : category === "processus" ? "Optimisation des processus RH (recrutement, onboarding, entretiens, gestion des temps)" : "Optimisation juridique/paie ET processus RH"}

Fournis 5 à 7 conseils originaux, pratiques et actionnables immédiatement.
Pour chaque conseil :
- Un titre court et percutant
- Une explication claire (2-3 phrases)
- L'impact concret (gain de temps, d'argent, ou de conformité)
- La référence légale si applicable

Format : texte structuré avec titres, pas de JSON.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export async function generateRevisionContent(
  theme: ThemeKey,
  weakAreas: string[]
): Promise<string> {
  const themeLabel = THEMES[theme].label;
  const themeContext = THEME_CONTEXT[theme];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `En tant qu'expert RH, rédige une fiche de révision synthétique sur : ${themeLabel}

Contexte : ${themeContext}
Points faibles identifiés : ${weakAreas.join(", ")}

La fiche doit résumer les points clés, citer les articles essentiels, donner des exemples pratiques.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content ?? "";
}
