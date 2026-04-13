"use client";

import { useState, useEffect, useMemo } from "react";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import type { NotionQuestion } from "@/lib/notion";
import { cn } from "@/lib/utils";
import { BookOpen, Loader2, Search, X } from "lucide-react";

// ─── Sous-catégories par thème ────────────────────────────────────────────────

const SUBCATEGORIES: Record<ThemeKey, { label: string; keywords: string[] }[]> = {
  RECRUTEMENT: [
    { label: "Marque employeur",   keywords: ["marque employeur", "attractivité", "image", "EVP"] },
    { label: "Onboarding",         keywords: ["onboarding", "intégration", "accueil", "période d'essai"] },
    { label: "Légal recrutement",  keywords: ["discrimination", "offre d'emploi", "égalité", "RGPD"] },
    { label: "Entretien",          keywords: ["entretien", "candidat", "recruteur", "sélection"] },
    { label: "GPEC / Formation",   keywords: ["GPEC", "compétences", "formation", "développement"] },
  ],
  DROIT_TRAVAIL: [
    { label: "Contrats",           keywords: ["CDI", "CDD", "contrat", "intérim", "apprentissage"] },
    { label: "Licenciement",       keywords: ["licenciement", "rupture", "démission", "conventionnelle"] },
    { label: "Congés",             keywords: ["congé", "RTT", "absence", "arrêt maladie"] },
    { label: "Durée du travail",   keywords: ["heures", "durée", "35h", "supplémentaires", "forfait"] },
    { label: "Santé & sécurité",   keywords: ["santé", "sécurité", "accident", "inaptitude"] },
  ],
  PAIE: [
    { label: "Bulletin de paie",   keywords: ["bulletin", "fiche de paie", "brut", "net"] },
    { label: "Cotisations",        keywords: ["cotisation", "charges", "URSSAF", "patronal", "salarial"] },
    { label: "Avantages en nature",keywords: ["avantage en nature", "véhicule", "logement", "téléphone"] },
    { label: "Primes & bonus",     keywords: ["prime", "bonus", "13ème", "gratification"] },
    { label: "Épargne salariale",  keywords: ["intéressement", "participation", "PEE", "PERCO"] },
  ],
  RELATIONS_SOCIALES: [
    { label: "CSE",                keywords: ["CSE", "comité social", "représentant", "délégué"] },
    { label: "Négociation",        keywords: ["négociation", "accord", "syndicat", "collective"] },
    { label: "Discipline",         keywords: ["sanction", "faute", "discipline", "avertissement", "licenciement disciplinaire"] },
    { label: "Harcèlement / RPS",  keywords: ["harcèlement", "discrimination", "violence", "risques psychosociaux"] },
  ],
  DELAIS: [
    { label: "Préavis",            keywords: ["préavis", "prévenance", "délai de prévenance"] },
    { label: "Prescription",       keywords: ["prescription", "forclusion", "délai légal"] },
    { label: "Convocations",       keywords: ["convocation", "entretien préalable", "notification"] },
  ],
  AVANTAGES: [
    { label: "Tickets restaurant", keywords: ["ticket restaurant", "ticket repas", "panier repas"] },
    { label: "Mutuelle / Prévoyance", keywords: ["mutuelle", "prévoyance", "complémentaire santé"] },
    { label: "Cadeaux & bons d'achat", keywords: ["cadeau", "chèque", "bon d'achat", "limite CSE"] },
    { label: "Mobilité",           keywords: ["transport", "remboursement", "vélo", "pass navigo"] },
  ],
  CC_0086: [
    { label: "Classifications",    keywords: ["classification", "coefficient", "catégorie", "grille"] },
    { label: "Salaires minima",    keywords: ["salaire minimum", "minimum conventionnel", "grille salariale"] },
    { label: "Congés spécifiques", keywords: ["congé supplémentaire", "ancienneté", "congé conventionnel"] },
    { label: "Avantages CC 0086",  keywords: ["avantage spécifique", "publicité", "IDCC 0086"] },
  ],
};

export default function Library() {
  const [allQuestions, setAllQuestions] = useState<NotionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | "">("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0);
  const [selectedSubcat, setSelectedSubcat] = useState<string>("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Charger TOUTES les questions une seule fois
  useEffect(() => {
    setLoading(true);
    fetch("/api/library?limit=500")
      .then((r) => r.json())
      .then((d) => setAllQuestions(d.questions ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Réinitialiser la sous-catégorie quand le thème change
  useEffect(() => { setSelectedSubcat(""); }, [selectedTheme]);

  // Filtrage côté client
  const filtered = useMemo(() => {
    let q = allQuestions;

    // Filtre thème
    if (selectedTheme) q = q.filter((x) => x.theme === selectedTheme);

    // Filtre difficulté
    if (selectedDifficulty) q = q.filter((x) => x.difficulty === selectedDifficulty);

    // Filtre sous-catégorie (par mots-clés)
    if (selectedSubcat && selectedTheme) {
      const subcat = SUBCATEGORIES[selectedTheme]?.find((s) => s.label === selectedSubcat);
      if (subcat) {
        q = q.filter((x) => {
          const text = (x.question + " " + x.explanation + " " + x.source).toLowerCase();
          return subcat.keywords.some((kw) => text.includes(kw.toLowerCase()));
        });
      }
    }

    // Filtre recherche texte libre
    if (search.trim()) {
      const s = search.toLowerCase();
      q = q.filter((x) =>
        x.question.toLowerCase().includes(s) ||
        x.explanation.toLowerCase().includes(s) ||
        x.source?.toLowerCase().includes(s)
      );
    }

    return q;
  }, [allQuestions, selectedTheme, selectedDifficulty, selectedSubcat, search]);

  const subcats = selectedTheme ? (SUBCATEGORIES[selectedTheme] ?? []) : [];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Bibliothèque</h2>
        <p className="text-muted-foreground mt-1">
          {loading ? "Chargement…" : `${allQuestions.length} question${allQuestions.length > 1 ? "s" : ""} au total`}
        </p>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un mot-clé, un article de loi…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Filtres principaux */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value as ThemeKey | "")}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous les thèmes</option>
          {THEME_KEYS.map((k) => (
            <option key={k} value={k}>{THEMES[k].label}</option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(Number(e.target.value))}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value={0}>Toutes les difficultés</option>
          <option value={1}>Facile</option>
          <option value={2}>Moyen</option>
          <option value={3}>Difficile</option>
        </select>

        <span className="ml-auto text-sm text-muted-foreground self-center">
          {loading ? "…" : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Sous-catégories (apparaissent quand un thème est sélectionné) */}
      {subcats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {subcats.map((s) => (
            <button
              key={s.label}
              onClick={() => setSelectedSubcat(selectedSubcat === s.label ? "" : s.label)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                selectedSubcat === s.label
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">
            {allQuestions.length === 0 ? "Bibliothèque vide" : "Aucun résultat"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {allQuestions.length === 0
              ? "Les questions apparaîtront ici après votre premier quiz"
              : "Essayez d'autres filtres ou mots-clés"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const isOpen = expanded === q.id;
            const themeColor = THEMES[q.theme]?.color ?? "#6366f1";
            const diffLabel = q.difficulty === 1 ? "Facile" : q.difficulty === 3 ? "Difficile" : "Moyen";
            const diffColor = q.difficulty === 1 ? "text-green-600 bg-green-50" : q.difficulty === 3 ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50";

            // Surligner les mots-clés recherchés
            const highlight = (text: string) => {
              if (!search.trim()) return text;
              const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
              return text.replace(regex, "**$1**");
            };

            const highlightedQuestion = highlight(q.question);

            return (
              <div key={q.id} className="bg-white rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : q.id)}
                  className="w-full text-left p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-3 w-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: themeColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {highlightedQuestion.split("**").map((part, i) =>
                          i % 2 === 1
                            ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
                            : part
                        )}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground">{THEMES[q.theme]?.label ?? q.theme}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", diffColor)}>{diffLabel}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="space-y-1.5">
                      {q.options.map((opt, i) => {
                        const letter = ["A", "B", "C", "D"][i];
                        return (
                          <div key={i} className={cn("text-sm px-3 py-2 rounded-lg",
                            letter === q.answer ? "bg-green-50 text-green-800 font-medium border border-green-200" : "bg-gray-50 text-muted-foreground")}>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                      <p className="font-semibold text-blue-800 mb-1">Explication</p>
                      {q.explanation}
                      {q.source && <p className="mt-2 text-xs text-blue-500 font-medium">{q.source}</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
