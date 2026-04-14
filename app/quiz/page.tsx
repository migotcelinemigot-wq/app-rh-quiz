"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES, THEME_KEYS, DIFFICULTIES, THEME_GROUPS, SUBCATEGORIES } from "@/lib/themes";
import type { ThemeKey, ThemeGroup } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Sparkles, Tag } from "lucide-react";

const GROUP_ORDER: ThemeGroup[] = ["fondamentaux", "developpement", "administration", "humain", "digital"];

export default function QuizSetup() {
  const router = useRouter();
  const [theme, setTheme]           = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<number>(2);
  const [count, setCount]           = useState<number>(5);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<ThemeGroup, boolean>>({
    fondamentaux:  true,
    developpement: false,
    administration: false,
    humain:        false,
    digital:       false,
  });

  const handleThemeSelect = (key: string) => {
    setTheme(key);
    setSubcategory(""); // reset sous-catégorie quand on change de thème
  };

  const toggleGroup = (group: ThemeGroup) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleStart = async () => {
    if (!theme) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          difficulty,
          count,
          subcategory: subcategory || undefined,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la génération");

      const data = await res.json();
      sessionStorage.setItem("quizQuestions", JSON.stringify(data.questions));
      sessionStorage.setItem("quizTheme", theme);
      if (subcategory) sessionStorage.setItem("quizSubcategory", subcategory);
      else sessionStorage.removeItem("quizSubcategory");
      router.push("/quiz/session");
    } catch {
      setError("Impossible de générer les questions. Vérifiez vos clés API.");
      setLoading(false);
    }
  };

  const selectedThemeKey = THEME_KEYS.includes(theme as ThemeKey) ? (theme as ThemeKey) : null;
  const subcategories    = selectedThemeKey ? SUBCATEGORIES[selectedThemeKey] : [];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Nouveau quiz</h2>
        <p className="text-muted-foreground mt-1">
          QCM, Vrai/Faux, Définitions, Mises en situation, Classement, Texte à trous
        </p>
      </div>

      {/* ── THÈME ── */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h3 className="font-semibold mb-4">Thème</h3>

        {/* Tous les thèmes */}
        <button
          onClick={() => handleThemeSelect("TOUS")}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all mb-4",
            theme === "TOUS"
              ? "border-primary bg-primary/5"
              : "border-dashed border-primary/40 hover:border-primary hover:bg-primary/5"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Tous les thèmes mélangés</p>
            <p className="text-xs text-muted-foreground">
              Questions variées sur l'ensemble des 16 thèmes RH
            </p>
          </div>
        </button>

        {/* Groupes de thèmes */}
        <div className="space-y-3">
          {GROUP_ORDER.map((group) => {
            const groupData = THEME_GROUPS[group];
            const isExpanded = expandedGroups[group];
            const hasSelected = groupData.keys.includes(theme as ThemeKey);

            return (
              <div key={group} className={cn(
                "border rounded-xl overflow-hidden transition-all",
                hasSelected ? "border-primary/50" : "border-border"
              )}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                    hasSelected ? "bg-primary/5" : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {groupData.label}
                    {hasSelected && (
                      <span className="ml-2 text-xs font-normal text-primary">
                        · {THEMES[theme as ThemeKey]?.label}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Group themes */}
                {isExpanded && (
                  <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {groupData.keys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleThemeSelect(key)}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all",
                          theme === key
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:border-border hover:bg-gray-50"
                        )}
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: THEMES[key].color }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-xs leading-tight">{THEMES[key].label}</p>
                          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                            {THEMES[key].description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SOUS-CATÉGORIE (si thème spécifique sélectionné) ── */}
      {selectedThemeKey && subcategories.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Sous-catégorie</h3>
            <span className="text-xs text-muted-foreground">(optionnel)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Toutes */}
            <button
              onClick={() => setSubcategory("")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                subcategory === ""
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40 text-muted-foreground"
              )}
            >
              Toutes
            </button>

            {subcategories.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setSubcategory(sub.label)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                  subcategory === sub.label
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40 text-foreground"
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {subcategory && (
            <p className="text-xs text-primary mt-3 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Focus : <span className="font-semibold">{subcategory}</span>
            </p>
          )}
        </div>
      )}

      {/* ── DIFFICULTÉ ── */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h3 className="font-semibold mb-4">Niveau de difficulté</h3>
        <div className="flex gap-3">
          {([1, 2, 3] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                "flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                difficulty === d
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {DIFFICULTIES[d].label}
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {DIFFICULTIES[d].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── NOMBRE DE QUESTIONS ── */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold mb-4">Nombre de questions</h3>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 20, 50].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                "py-3 rounded-lg border-2 text-sm font-semibold transition-all text-center",
                count === n
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {n}
              <p className="text-xs font-normal text-muted-foreground mt-0.5">
                {n === 5 && "~5 min"}
                {n === 10 && "~10 min"}
                {n === 20 && "~20 min"}
                {n === 50 && "~45 min"}
              </p>
            </button>
          ))}
        </div>
        {count === 50 && (
          <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
            ⏱ La génération de 50 questions peut prendre 30 à 60 secondes — merci de patienter.
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        onClick={handleStart}
        disabled={!theme || loading}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-white transition-all",
          !theme || loading
            ? "bg-primary/50 cursor-not-allowed"
            : "bg-primary hover:bg-primary/90"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Génération des questions…
            {count === 50 && <span className="text-sm font-normal opacity-80">(peut prendre ~1 min)</span>}
          </span>
        ) : (
          `Lancer le quiz${subcategory ? ` — ${subcategory}` : ""}`
        )}
      </button>
    </div>
  );
}
