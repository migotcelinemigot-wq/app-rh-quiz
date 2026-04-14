"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import {
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Loader2,
  Trash2,
} from "lucide-react";

interface WrongAnswer {
  id: number;
  questionText: string;
  options: string[];
  type: string;
  userAnswer: string;
  correctAnswer: string;
  date: string;
}

interface ThemeGroup {
  theme: string;
  count: number;
  answers: WrongAnswer[];
}

export default function Revisions() {
  const router = useRouter();
  const [groups, setGroups] = useState<ThemeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch("/api/revisions/wrong-answers")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.grouped ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (theme: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(theme) ? next.delete(theme) : next.add(theme);
      return next;
    });
  };

  const handleReset = async () => {
    if (!confirm(`Supprimer toutes les ${total} questions à réviser ? Cette action est irréversible.`)) return;
    setResetting(true);
    await fetch("/api/revisions/reset", { method: "DELETE" });
    setGroups([]);
    setTotal(0);
    setResetting(false);
  };

  const retryTheme = (group: ThemeGroup) => {
    // Passer les questions ratées à la session de révision
    const questions = group.answers.map((a) => ({
      id: a.id,
      questionText: a.questionText,
      options: a.options,
      type: a.type,
      correctAnswer: a.correctAnswer,
      theme: group.theme,
    }));
    sessionStorage.setItem("revisionQuestions", JSON.stringify(questions));
    sessionStorage.setItem("revisionTheme", group.theme);
    router.push("/revisions/session");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* En-tête */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Révisions</h2>
          <p className="text-muted-foreground mt-1">
            {total > 0
              ? `${total} question${total > 1 ? "s" : ""} à retravailler, groupées par thème`
              : "Aucune question à réviser pour l'instant"}
          </p>
        </div>
        {total > 0 && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {resetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Tout effacer
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-green-700 text-lg">Aucune erreur à réviser !</p>
          <p className="text-sm text-green-600 mt-1">
            Lance un quiz pour commencer à t'entraîner.
          </p>
          <button
            onClick={() => router.push("/quiz")}
            className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Lancer un quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const themeKey = group.theme as ThemeKey;
            const theme = THEMES[themeKey];
            const isOpen = expanded.has(group.theme);

            return (
              <div
                key={group.theme}
                className="bg-white rounded-xl border border-border overflow-hidden"
              >
                {/* En-tête du thème */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleExpand(group.theme)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme?.color ?? "#6366f1" }}
                    />
                    <div>
                      <p className="font-semibold">
                        {theme?.label ?? group.theme}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {group.count} question{group.count > 1 ? "s" : ""} ratée{group.count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Badge count */}
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                      {group.count}
                    </span>
                    {/* Bouton retenter */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        retryTheme(group);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retenter ({group.count})
                    </button>
                    {/* Toggle */}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Liste des questions ratées */}
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {group.answers.map((a, i) => (
                      <div key={a.id} className="p-4">
                        {/* Numéro + question */}
                        <div className="flex gap-3 mb-3">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium leading-snug">
                            {a.questionText}
                          </p>
                        </div>

                        {/* Réponses */}
                        <div className="ml-8 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-600">
                              Ta réponse :{" "}
                              <span className="font-medium">{a.userAnswer}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-green-600">
                              Bonne réponse :{" "}
                              <span className="font-medium">{a.correctAnswer}</span>
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(a.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Pied du groupe : bouton centré */}
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        Génère un quiz sur ce thème pour t'améliorer
                      </span>
                      <button
                        onClick={() => retryTheme(group)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retenter les {group.count} questions
                      </button>
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
