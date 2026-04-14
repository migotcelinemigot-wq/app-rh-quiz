import Groq from "groq-sdk";
import type { ThemeKey } from "./themes";
import { THEMES, DIFFICULTIES } from "./themes";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type QuestionType =
  | "QCM"
  | "VRAI_FAUX"
  | "DEFINITION"
  | "MISE_EN_SITUATION"
  | "CLASSEMENT"
  | "PRIORITE"
  | "TEXTE_A_TROUS";

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options: string[];   // ["A. ...", "B. ...", ...] ou ["Vrai", "Faux"] ou items à classer
  answer: string;      // "A", "B", "Vrai", "Faux", ou "A,C,B,D" pour CLASSEMENT
  explanation: string; // Format : "📌 Définition : [...] 💡 Exemple : [...] ⚠️ Contre-exemple : [...]"
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
  QCM: `Question à choix multiple avec 4 options (A, B, C, D). Une seule bonne réponse. Les distracteurs doivent être plausibles et piégeux — pas de mauvaises réponses évidentes. Mélanger des détails proches (délais légaux voisins, seuils similaires).
Format : { "type": "QCM", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B", "explanation": "...", "source": "..." }`,

  VRAI_FAUX: `Affirmation à valider. L'affirmation doit être précise, sourcée et non évidente (ni clairement vraie ni clairement fausse au premier abord). Utiliser des nuances légales fines.
Format : { "type": "VRAI_FAUX", "question": "Affirmation précise à évaluer", "options": ["Vrai", "Faux"], "answer": "Vrai", "explanation": "...", "source": "..." }`,

  DEFINITION: `Trouver la définition exacte d'un terme RH/juridique parmi 4 propositions. Les 3 mauvaises définitions doivent être partiellement correctes ou proches pour être piégeuses.
Format : { "type": "DEFINITION", "question": "Qu'est-ce que [terme juridique ou RH précis] ?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "source": "..." }`,

  MISE_EN_SITUATION: `Scénario concret RH réaliste et détaillé. Décrire une situation ambiguë où la bonne réaction n'est pas évidente. Proposer 4 actions toutes plausibles, dont une seule est légalement correcte.
Format : { "type": "MISE_EN_SITUATION", "question": "Situation : [description détaillée et réaliste]. Que faites-vous en priorité ?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "C", "explanation": "...", "source": "..." }`,

  CLASSEMENT: `Classer 4 actions ou étapes dans le bon ordre chronologique ou de priorité. Les 4 items doivent être des étapes réelles d'une procédure RH/légale. L'answer est l'ordre correct des lettres séparées par des virgules.
IMPORTANT : l'answer doit être une chaîne comme "A,C,B,D" indiquant que l'étape A est la 1ère, C la 2ème, B la 3ème, D la 4ème.
Format : { "type": "CLASSEMENT", "question": "Classez ces étapes dans l'ordre correct pour [procédure] :", "options": ["A. [étape]", "B. [étape]", "C. [étape]", "D. [étape]"], "answer": "B,A,D,C", "explanation": "...", "source": "..." }`,

  PRIORITE: `Situation concrète RH avec 4 actions possibles. Une seule est la priorité absolue légale ou procédurale. Les 3 autres sont des actions légitimes mais secondaires. Question du type "quelle est votre PREMIÈRE action ?".
Format : { "type": "PRIORITE", "question": "Situation : [description]. Quelle est votre première action obligatoire ?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B", "explanation": "...", "source": "..." }`,

  TEXTE_A_TROUS: `Compléter une phrase juridique ou réglementaire précise avec les termes exacts. La phrase contient 1 à 2 blancs notés ___ à compléter. Les 4 options proposent des compléments différents. Choisir des chiffres, délais ou termes légaux précis pour les blancs.
Format : { "type": "TEXTE_A_TROUS", "question": "L'article ... prévoit que [phrase avec ___  à compléter] ___.", "options": ["A. [complément]", "B. [complément]", "C. [complément]", "D. [complément]"], "answer": "A", "explanation": "...", "source": "..." }`,
};

// Ordre de rotation des types (les plus engageants en premier)
const TYPE_ROTATION: QuestionType[] = [
  "MISE_EN_SITUATION",
  "QCM",
  "CLASSEMENT",
  "TEXTE_A_TROUS",
  "PRIORITE",
  "VRAI_FAUX",
  "DEFINITION",
];

const EXPLANATION_FORMAT = `Pour CHAQUE question, l'explication DOIT suivre ce format EXACT (3 paragraphes séparés par des sauts de ligne) :
"📌 Définition : [définition précise et complète du concept juridique concerné]
💡 Exemple : [exemple concret et pratique tiré de la réalité RH]
⚠️ Contre-exemple : [erreur fréquente à éviter ou cas qui ne s'applique PAS]"`;

const NUANCE_RULES = `Règles de qualité OBLIGATOIRES :
- Les distracteurs (mauvaises réponses) doivent être plausibles et piégeux, jamais absurdes
- Éviter les réponses dont la bonne réponse est évidente ("jamais", "toujours", "aucun délai")
- Utiliser des chiffres précis et proches dans les options (ex: 15 jours vs 18 jours vs 21 jours)
- Pour les mises en situation, choisir des scénarios où la loi et l'intuition divergent
- Les questions doivent tester la précision légale, pas le bon sens général`;

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

  // Répartir les types de questions selon la rotation
  const typeDistribution: QuestionType[] = Array.from(
    { length: count },
    (_, i) => TYPE_ROTATION[i % TYPE_ROTATION.length]
  );

  const typeSummary = typeDistribution.reduce(
    (acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const typeInstructions = Object.entries(typeSummary)
    .map(([t, n]) =>
      `▸ ${n} question(s) de type ${t} :\n  ${TYPE_INSTRUCTIONS[t as QuestionType]}`
    )
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Tu es un expert juriste et formateur RH spécialisé en droit du travail français et CC 0086 (Publicité). Tu génères des questions de formation professionnelle exigeantes en JSON. Réponds UNIQUEMENT avec un objet JSON valide de la forme {"questions": [...]}.`,
      },
      {
        role: "user",
        content: `Génère exactement ${count} question(s) de niveau ${difficultyLabel} sur le thème : ${themeLabel}.

Contexte détaillé : ${themeContext}

${NUANCE_RULES}

Types de questions requis :
${typeInstructions}

${EXPLANATION_FORMAT}

Réponds avec : {"questions": [ /* exactement ${count} objets */ ]}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 5000,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const parsed = JSON.parse(text);
  const questions: GeneratedQuestion[] = parsed.questions ?? parsed;
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
