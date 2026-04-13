export const THEMES = {
  DROIT_TRAVAIL: {
    label: "Droit du travail",
    description: "Contrats, licenciements, période d'essai, congés légaux",
    color: "#6366f1",
  },
  PAIE: {
    label: "Paie & rémunération",
    description: "Calcul salaire, charges sociales, primes, avantages en nature",
    color: "#10b981",
  },
  RECRUTEMENT: {
    label: "Recrutement & GPEC",
    description: "Fiches de poste, entretiens, formation, gestion des compétences",
    color: "#f59e0b",
  },
  RELATIONS_SOCIALES: {
    label: "Relations sociales",
    description: "CSE, syndicats, négociation, discipline",
    color: "#ef4444",
  },
  DELAIS: {
    label: "Délais légaux",
    description: "Délais de préavis, de prescription, délais de réponse",
    color: "#8b5cf6",
  },
  AVANTAGES: {
    label: "Avantages & bénéfices",
    description: "Primes, cadeaux, avantages en nature, tickets-repas",
    color: "#ec4899",
  },
  CC_0086: {
    label: "Convention Publicité (CC 0086)",
    description: "Spécificités de la convention collective 0086 — secteur Publicité",
    color: "#14b8a6",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export const THEME_CONTEXT: Record<ThemeKey, string> = {
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

export const DIFFICULTIES = {
  1: { label: "Facile", description: "Notions de base, définitions" },
  2: { label: "Moyen", description: "Application pratique, cas courants" },
  3: { label: "Difficile", description: "Cas complexes, nuances juridiques" },
} as const;
