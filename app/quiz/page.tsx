"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES, THEME_KEYS, DIFFICULTIES } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

export default function QuizSetup() {
  const router = useRouter();
  const [theme, setTheme] = useState<string>("");
  const [difficulty, setDifficulty] = useState<number>(2);
  const [count, setCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!theme) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, difficulty, count }),
      });

      if (!res.ok) throw new Error("Erreur lors de la génération");

      const data = await res.json();
      sessionStorage.setItem("quizQuestions", JSON.stringify(data.questions));
      sessionStorage.setItem("quizTheme", theme);
      router.push("/quiz/session");
    } catch {
      setError("Impossible de générer les questions. Vérifiez vos clés API.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Nouveau quiz</h2>
        <p className="text-muted-foreground mt-1">
          QCM, Vrai/Faux, Définitions, Mises en situation
        </p>
      </div>

      {/* Thème */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h3 className="font-semibold mb-4">Thème</h3>

        {/* Bouton tous les thèmes */}
        <button
          onClick={() => setTheme("TOUS")}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all mb-3",
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
              Questions variées sur l'ensemble des 7 thèmes RH
            </p>
          </div>
        </button>

        {/* Thèmes individuels */}
        <div className="space-y-2">
          {THEME_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all w-full",
                theme === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: THEMES[key].color }}
              />
              <div>
                <p className="font-medium text-sm">{THEMES[key].label}</p>
                <p className="text-xs text-muted-foreground">{THEMES[key].description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulté */}
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

      {/* Nombre de questions */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold mb-4">Nombre de questions</h3>
        <div className="flex gap-3">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                "flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all",
                count === n
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {n} questions
            </button>
          ))}
        </div>
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
          </span>
        ) : (
          "Lancer le quiz"
        )}
      </button>
    </div>
  );
}
