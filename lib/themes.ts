export const THEMES = {
  // ── FONDAMENTAUX RH (7 thèmes historiques) ──────────────────────────────
  DROIT_TRAVAIL: {
    label: "Droit du travail",
    description: "Contrats, licenciements, ruptures, congés légaux",
    color: "#6366f1",
    group: "fondamentaux",
  },
  PAIE: {
    label: "Paie & rémunération",
    description: "Calcul salaire, charges sociales, bulletins, DSN",
    color: "#10b981",
    group: "fondamentaux",
  },
  RECRUTEMENT: {
    label: "Recrutement & GPEC",
    description: "Sourcing, entretiens, onboarding, gestion des compétences",
    color: "#f59e0b",
    group: "fondamentaux",
  },
  RELATIONS_SOCIALES: {
    label: "Relations sociales",
    description: "CSE, syndicats, négociation collective, conflits",
    color: "#ef4444",
    group: "fondamentaux",
  },
  DELAIS: {
    label: "Délais légaux",
    description: "Délais de préavis, prescription, convocation, réponse",
    color: "#8b5cf6",
    group: "fondamentaux",
  },
  AVANTAGES: {
    label: "Avantages & bénéfices",
    description: "Mutuelle, tickets-repas, PEE, intéressement, cadeaux",
    color: "#ec4899",
    group: "fondamentaux",
  },
  CC_0086: {
    label: "Convention Publicité (CC 0086)",
    description: "Spécificités IDCC 0086 — classifications, salaires, avantages",
    color: "#14b8a6",
    group: "fondamentaux",
  },

  // ── DÉVELOPPEMENT RH ─────────────────────────────────────────────────────
  GESTION_PERFORMANCE: {
    label: "Gestion de la performance",
    description: "Entretiens annuels, KPI RH, OKR, feedback, évaluation",
    color: "#f97316",
    group: "developpement",
  },
  FORMATION_COMPETENCES: {
    label: "Formation & compétences",
    description: "Plan de formation, CPF, GPEC, upskilling, coaching",
    color: "#16a34a",
    group: "developpement",
  },
  GESTION_TALENTS: {
    label: "Gestion des talents",
    description: "Plans carrière, mobilité, promotion, succession planning",
    color: "#7c3aed",
    group: "developpement",
  },

  // ── ADMINISTRATION & STRATÉGIE ───────────────────────────────────────────
  ADMIN_RH: {
    label: "Administration RH",
    description: "Dossiers salariés, contrats, mobilité, suivi effectifs, reporting",
    color: "#64748b",
    group: "administration",
  },
  REMUNERATION: {
    label: "Politique de rémunération",
    description: "Politique salariale, bonus, équité, stock-options, benchmark",
    color: "#d97706",
    group: "administration",
  },
  STRATEGIE_RH: {
    label: "Stratégie & transformation RH",
    description: "Stratégie RH, digital, workforce planning, change management",
    color: "#1d4ed8",
    group: "administration",
  },

  // ── HUMAIN & BIEN-ÊTRE ───────────────────────────────────────────────────
  QVT_DIVERSITE: {
    label: "QVT & diversité",
    description: "Diversité, inclusion, égalité F/H, QVCT, bien-être, RPS",
    color: "#db2777",
    group: "humain",
  },
  SANTE_SECURITE: {
    label: "Santé & sécurité au travail",
    description: "SST, accidents du travail, médecine du travail, ergonomie",
    color: "#b45309",
    group: "humain",
  },

  // ── DIGITAL RH ──────────────────────────────────────────────────────────
  SIRH_DIGITAL: {
    label: "SIRH & digital RH",
    description: "Logiciels RH, ATS, paie digitalisée, data RH, IA en RH",
    color: "#0891b2",
    group: "digital",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
export type ThemeGroup = "fondamentaux" | "developpement" | "administration" | "humain" | "digital";

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export const THEME_GROUPS: Record<ThemeGroup, { label: string; keys: ThemeKey[] }> = {
  fondamentaux: {
    label: "Fondamentaux RH",
    keys: ["DROIT_TRAVAIL", "PAIE", "RECRUTEMENT", "RELATIONS_SOCIALES", "DELAIS", "AVANTAGES", "CC_0086"],
  },
  developpement: {
    label: "Développement RH",
    keys: ["GESTION_PERFORMANCE", "FORMATION_COMPETENCES", "GESTION_TALENTS"],
  },
  administration: {
    label: "Administration & Stratégie",
    keys: ["ADMIN_RH", "REMUNERATION", "STRATEGIE_RH"],
  },
  humain: {
    label: "Humain & Bien-être",
    keys: ["QVT_DIVERSITE", "SANTE_SECURITE"],
  },
  digital: {
    label: "Digital RH",
    keys: ["SIRH_DIGITAL"],
  },
};

export const SUBCATEGORIES: Record<ThemeKey, { key: string; label: string }[]> = {
  DROIT_TRAVAIL: [
    { key: "contrats_travail",      label: "Contrats de travail" },
    { key: "rupture_contrat",       label: "Rupture de contrat (licenciement, démission)" },
    { key: "duree_travail",         label: "Durée du travail" },
    { key: "obligations_legales",   label: "Obligations légales employeur" },
    { key: "contentieux",           label: "Contentieux prud'homal" },
    { key: "convention_collective", label: "Convention collective" },
    { key: "sante_securite_droit",  label: "Santé & sécurité (obligations légales)" },
  ],
  PAIE: [
    { key: "calcul_paie",       label: "Calcul de paie" },
    { key: "bulletins_salaire", label: "Bulletins de salaire" },
    { key: "charges_sociales",  label: "Charges sociales" },
    { key: "dsn",               label: "Déclarations sociales (DSN)" },
    { key: "gestion_absences",  label: "Gestion des absences" },
    { key: "temps_travail",     label: "Temps de travail / pointage" },
  ],
  RECRUTEMENT: [
    { key: "sourcing",          label: "Sourcing candidats" },
    { key: "entretiens_recru",  label: "Entretiens de recrutement" },
    { key: "tests_assessments", label: "Tests et assessments" },
    { key: "marque_employeur",  label: "Marque employeur" },
    { key: "onboarding",        label: "Onboarding (intégration)" },
    { key: "recrutement_digital", label: "Recrutement digital (ATS, job boards)" },
  ],
  RELATIONS_SOCIALES: [
    { key: "cse",              label: "CSE (Comité Social et Économique)" },
    { key: "dialogue_social",  label: "Dialogue social" },
    { key: "syndicats",        label: "Syndicats" },
    { key: "negociations",     label: "Négociations collectives" },
    { key: "conflits_sociaux", label: "Gestion des conflits sociaux" },
    { key: "accords_entreprise", label: "Accords d'entreprise" },
  ],
  DELAIS: [
    { key: "delais_preavis",       label: "Délais de préavis" },
    { key: "delais_prescription",  label: "Délais de prescription" },
    { key: "delais_convocation",   label: "Délais de convocation" },
    { key: "delais_rupture_conv",  label: "Délais de rupture conventionnelle" },
    { key: "delais_reponse",       label: "Délais de réponse aux courriers" },
  ],
  AVANTAGES: [
    { key: "avantages_sociaux",     label: "Avantages sociaux" },
    { key: "mutuelle_prevoyance",   label: "Mutuelle & prévoyance" },
    { key: "tickets_restaurant",    label: "Tickets restaurant" },
    { key: "interessement_participation", label: "Intéressement & participation" },
    { key: "pee_perco",             label: "PEE / PERCO" },
    { key: "cheques_cadeaux",       label: "Chèques cadeaux (limites CSE)" },
  ],
  CC_0086: [
    { key: "classifications",        label: "Classifications" },
    { key: "grilles_salaires",       label: "Grilles de salaires" },
    { key: "conges_supplementaires", label: "Congés supplémentaires CC 0086" },
    { key: "primes_specifiques",     label: "Primes spécifiques Publicité" },
    { key: "avantages_publicite",    label: "Avantages secteur Publicité" },
    { key: "champ_application",      label: "Champ d'application IDCC 0086" },
  ],
  GESTION_PERFORMANCE: [
    { key: "entretiens_annuels",    label: "Entretiens annuels" },
    { key: "evaluation_competences", label: "Évaluation des compétences" },
    { key: "kpi_rh",                label: "KPI RH" },
    { key: "plans_amelioration",    label: "Plans d'amélioration" },
    { key: "feedback_continu",      label: "Feedback continu" },
    { key: "okr",                   label: "Gestion des objectifs (OKR)" },
  ],
  FORMATION_COMPETENCES: [
    { key: "plan_formation",   label: "Plan de formation" },
    { key: "cpf",              label: "Compte Personnel de Formation (CPF)" },
    { key: "gpec",             label: "Gestion des compétences (GPEC)" },
    { key: "upskilling",       label: "Upskilling / reskilling" },
    { key: "coaching_mentoring", label: "Coaching & mentoring" },
    { key: "parcours_carriere", label: "Parcours carrière" },
  ],
  GESTION_TALENTS: [
    { key: "plans_carriere",       label: "Plans de carrière" },
    { key: "promotion_interne",    label: "Promotion interne" },
    { key: "mobilite_geographique", label: "Mobilité géographique" },
    { key: "mobilite_fonctionnelle", label: "Mobilité fonctionnelle" },
    { key: "succession_planning",  label: "Succession planning" },
    { key: "retention_talents",    label: "Rétention des talents" },
  ],
  ADMIN_RH: [
    { key: "dossiers_salaries",  label: "Dossiers salariés" },
    { key: "gestion_contrats",   label: "Gestion des contrats" },
    { key: "mobilite_interne",   label: "Mobilité interne" },
    { key: "mutations_promotions", label: "Mutations / promotions" },
    { key: "suivi_effectifs",    label: "Suivi des effectifs" },
    { key: "reporting_rh",       label: "Reporting RH" },
  ],
  REMUNERATION: [
    { key: "politique_salariale", label: "Politique salariale" },
    { key: "bonus_primes",        label: "Bonus et primes" },
    { key: "equite_salariale",    label: "Équité salariale" },
    { key: "avantages_nature",    label: "Avantages en nature" },
    { key: "stock_options",       label: "Stock-options" },
    { key: "benchmark_salarial",  label: "Benchmark salarial" },
  ],
  STRATEGIE_RH: [
    { key: "strategie_rh",        label: "Stratégie RH" },
    { key: "transformation_digitale", label: "Transformation RH digitale" },
    { key: "workforce_planning",  label: "Workforce planning" },
    { key: "organisation_travail", label: "Organisation du travail" },
    { key: "change_management",   label: "Change management" },
    { key: "gestion_effectifs",   label: "Gestion des effectifs" },
  ],
  QVT_DIVERSITE: [
    { key: "diversite_inclusion",  label: "Diversité et inclusion" },
    { key: "egalite_fh",           label: "Égalité femmes/hommes" },
    { key: "handicap_inclusion",   label: "Handicap et inclusion" },
    { key: "qvct",                 label: "Qualité de vie au travail (QVCT)" },
    { key: "bien_etre",            label: "Bien-être au travail" },
    { key: "rps",                  label: "Prévention des risques psychosociaux (RPS)" },
  ],
  SANTE_SECURITE: [
    { key: "hygiene_securite",     label: "Hygiène et sécurité" },
    { key: "accidents_travail",    label: "Accidents du travail" },
    { key: "medecine_travail",     label: "Médecine du travail" },
    { key: "prevention_risques",   label: "Prévention des risques" },
    { key: "ergonomie",            label: "Ergonomie" },
    { key: "reglement_interieur",  label: "Règlement intérieur" },
  ],
  SIRH_DIGITAL: [
    { key: "logiciels_rh",      label: "Logiciels RH (SIRH)" },
    { key: "ats",               label: "ATS (recrutement)" },
    { key: "paie_digitalisee",  label: "Paie digitalisée" },
    { key: "automatisation_rh", label: "Automatisation RH" },
    { key: "data_rh",           label: "Data RH / People analytics" },
    { key: "ia_rh",             label: "IA en RH" },
  ],
};

export const THEME_CONTEXT: Record<ThemeKey, string> = {
  DROIT_TRAVAIL:
    "le droit du travail français : contrats de travail (CDI, CDD, intérim), période d'essai, rupture du contrat, licenciement, démission, congés payés, durée du travail, heures supplémentaires, obligations légales de l'employeur, contentieux prud'homal",
  PAIE:
    "la paie et la rémunération : calcul du salaire brut/net, cotisations sociales (patronales et salariales), primes légales et conventionnelles, avantages en nature, bulletin de paie, DSN (Déclaration Sociale Nominative), gestion des absences, minimum conventionnel CC 0086",
  RECRUTEMENT:
    "le recrutement et la GPEC : processus de recrutement, sourcing candidats, entretiens d'embauche (questions légales et illégales), tests et assessments, marque employeur, onboarding, ATS et job boards, GPEC (gestion prévisionnelle des emplois et compétences)",
  RELATIONS_SOCIALES:
    "les relations sociales en entreprise : Comité Social et Économique (CSE — attributions, fonctionnement, seuils), délégués syndicaux, négociation collective, accords d'entreprise, gestion des conflits sociaux, procédures disciplinaires, harcèlement moral et sexuel",
  DELAIS:
    "les délais légaux RH : préavis de licenciement et démission (par ancienneté/catégorie), délais de prescription des actions prud'homales (2 ans, 3 ans, 5 ans selon le cas), délais de réponse aux courriers recommandés, délais de convocation à entretien préalable, délais de rupture conventionnelle",
  AVANTAGES:
    "les avantages et bénéfices salariaux : tickets restaurant (valeur, part patronale), mutuelle obligatoire (loi ANI, 50% patronal), prévoyance, intéressement et participation, PEE/PERCO, chèques cadeaux (limites d'exonération CSE), avantages en nature (véhicule, logement, téléphone)",
  CC_0086:
    "la convention collective nationale 0086 (Publicité — IDCC 0086) : champ d'application (agences de publicité, conseil en communication), classifications (catégories A à G), grilles de salaires minima, avantages spécifiques, congés supplémentaires, clauses particulières du secteur Publicité",
  GESTION_PERFORMANCE:
    "la gestion de la performance RH : entretiens annuels d'évaluation (cadre légal, bonne pratique), entretiens professionnels (obligatoires tous les 2 ans), KPI RH (taux d'absentéisme, turnover, satisfaction), méthodes d'évaluation des compétences, plans d'amélioration de la performance (PIP), feedback continu, gestion des objectifs SMART et OKR",
  FORMATION_COMPETENCES:
    "la formation et la gestion des compétences : plan de développement des compétences (ex-plan de formation), CPF (Compte Personnel de Formation — droits, abondement, utilisations), GPEC/GEPP (gestion prévisionnelle des emplois et des compétences), upskilling et reskilling, coaching professionnel et mentoring, construction des parcours carrière, OPCO (obligations de financement)",
  GESTION_TALENTS:
    "la gestion des talents et des carrières : plans de carrière individualisés, politiques de promotion interne, mobilité géographique (mutation avec accord salarié, clause de mobilité), mobilité fonctionnelle (changement de poste), succession planning (identification et préparation des remplaçants de postes clés), rétention des talents, entretiens de départ",
  ADMIN_RH:
    "l'administration du personnel et le reporting RH : constitution et conservation des dossiers salariés (documents obligatoires, durées de conservation RGPD), gestion des contrats de travail et avenants, processus de mobilité interne (mutations, promotions, reclassements), suivi des effectifs (entrées/sorties, tableaux de bord), reporting RH et indicateurs obligatoires (index égalité professionnelle, BDES)",
  REMUNERATION:
    "la politique de rémunération : construction d'une politique salariale (grilles, bandes salariales, révisions annuelles), bonus et primes (variables, objectifs, conditions de versement), équité salariale et index égalité professionnelle, avantages en nature (évaluation, déclaration), stock-options et BSPCE (conditions, fiscalité), benchmark salarial (sources, méthodes, positionnement)",
  STRATEGIE_RH:
    "la stratégie et la transformation RH : élaboration d'une stratégie RH alignée sur la stratégie d'entreprise, transformation digitale RH (digitalisation des processus, SIRH), workforce planning (planification des besoins en effectifs à 3-5 ans), modèles d'organisation du travail (télétravail, hybride, flex-office), conduite du changement (change management — résistances, communication, formation), pilotage de la masse salariale",
  QVT_DIVERSITE:
    "la qualité de vie au travail et la diversité : politique de diversité et d'inclusion (enjeux légaux et stratégiques), égalité professionnelle femmes/hommes (index, plan d'action, négociation annuelle obligatoire), obligations liées au handicap (OETH — 6%, RQTH, AGEFIPH), accord QVCT (qualité de vie et conditions de travail), prévention du bien-être et des risques psychosociaux (RPS — stress, burnout, harcèlement), accord télétravail",
  SANTE_SECURITE:
    "la santé et la sécurité au travail : obligations légales de l'employeur en matière de SST (Code du travail), Document Unique d'Évaluation des Risques Professionnels (DUERP — mise à jour, contenu), accidents du travail et maladies professionnelles (déclaration, reconnaissance, conséquences), médecine du travail (visites obligatoires, inaptitude, reclassement), prévention des risques (analyse, plans d'action, formation sécurité), ergonomie des postes de travail, règlement intérieur (contenu obligatoire, procédure d'adoption)",
  SIRH_DIGITAL:
    "le SIRH et la digitalisation RH : logiciels RH (SIRH — fonctionnalités, choix, implémentation), ATS (Applicant Tracking System — fonctionnement, avantages, bonnes pratiques), paie digitalisée (logiciels de paie, contrôles, interfaces DSN), automatisation des processus RH (workflows, chatbots RH), data RH et people analytics (indicateurs clés, tableaux de bord, prédictif), IA en RH (recrutement prédictif, analyse des performances, chatbots, enjeux éthiques)",
};

export const DIFFICULTIES = {
  1: { label: "Facile", description: "Notions de base, définitions" },
  2: { label: "Moyen", description: "Application pratique, cas courants" },
  3: { label: "Difficile", description: "Cas complexes, nuances juridiques" },
} as const;
