"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, BookOpen, ExternalLink, AlertTriangle, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import type { QuestionType } from "@/lib/claude";

interface QuizCardProps {
  questionNumber: number;
  totalQuestions: number;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
  theme?: string;
  onAnswer: (answer: string, isCorrect: boolean, timeSpent: number) => void;
  startTime: number;
}

function buildSourceUrl(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("art.") || s.includes("l.") || s.includes("code du travail") || s.includes("r.") || s.includes("l1") || s.includes("l2") || s.includes("l3")) {
    return `https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=${encodeURIComponent(source)}&page=1&pageSize=10`;
  }
  if (s.includes("cc 0086") || s.includes("0086") || s.includes("idcc")) {
    return `https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=${encodeURIComponent("convention collective 0086 publicité " + source)}&page=1&pageSize=10`;
  }
  if (s.includes("urssaf")) return `https://www.urssaf.fr/recherche?q=${encodeURIComponent(source)}`;
  return `https://www.google.com/search?q=${encodeURIComponent(source + " droit du travail français")}`;
}

const TYPE_BADGE: Record<QuestionType, { label: string; color: string }> = {
  QCM:              { label: "QCM",             color: "bg-indigo-100 text-indigo-700" },
  VRAI_FAUX:        { label: "Vrai / Faux",      color: "bg-amber-100 text-amber-700" },
  DEFINITION:       { label: "Définition",       color: "bg-emerald-100 text-emerald-700" },
  MISE_EN_SITUATION:{ label: "Mise en situation", color: "bg-purple-100 text-purple-700" },
};

export default function QuizCard({
  questionNumber, totalQuestions, type, question, options,
  correctAnswer, explanation, source, theme, onAnswer, startTime,
}: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "open" | "sending" | "done_correct" | "done_error">("idle");

  const handleSelect = (value: string) => {
    if (revealed) return;
    setSelected(value);
    setRevealed(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onAnswer(value, value === correctAnswer, timeSpent);
  };

  const handleReport = async (toolIsWrong: boolean) => {
    setReportState("sending");
    if (!toolIsWrong) {
      setReportState("done_correct");
      return;
    }
    try {
      await fetch("/api/quiz/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: {
            questionText: question,
            correctAnswer,
            userAnswer: selected ?? "",
            explanation,
            source,
            type,
            theme: theme ?? "",
          },
        }),
      });
      setReportState("done_error");
    } catch {
      setReportState("done_error");
    }
  };

  const getOptionStyle = (value: string) => {
    if (!revealed)
      return "border-border hover:border-primary/50 hover:bg-accent cursor-pointer";
    if (value === correctAnswer)
      return "border-green-500 bg-green-50 text-green-800";
    if (value === selected && value !== correctAnswer)
      return "border-red-400 bg-red-50 text-red-800";
    return "border-border text-muted-foreground";
  };

  const badge = TYPE_BADGE[type] ?? TYPE_BADGE.QCM;
  const isVraiFaux = type === "VRAI_FAUX";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress + badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", badge.color)}>
            {badge.label}
          </span>
          <span className="text-sm text-muted-foreground">
            {questionNumber} / {totalQuestions}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full",
                i < questionNumber - 1 ? "bg-primary" :
                i === questionNumber - 1 ? "bg-primary/60" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-border rounded-xl p-6 mb-4 shadow-sm">
        {type === "MISE_EN_SITUATION" && (
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
            Situation réelle
          </p>
        )}
        <p className="text-base font-medium leading-relaxed">{question}</p>
      </div>

      {/* Options */}
      <div className={cn("mb-4", isVraiFaux ? "flex gap-3" : "space-y-3")}>
        {options.map((option, i) => {
          const letter = isVraiFaux ? option : ["A", "B", "C", "D"][i];
          const value = isVraiFaux ? option : letter;
          const displayLabel = isVraiFaux
            ? (option === "Vrai" ? "✅ Oui, l'information est vraie" : "❌ Non, l'information est fausse")
            : option.replace(/^[A-D]\.\s*/, "");

          return (
            <button
              key={i}
              onClick={() => handleSelect(value)}
              disabled={revealed}
              className={cn(
                "text-left px-4 py-3 rounded-xl border-2 transition-all text-sm",
                isVraiFaux ? "flex-1 text-center font-semibold text-base" : "w-full",
                getOptionStyle(value)
              )}
            >
              {!isVraiFaux && <span className="font-semibold mr-2">{letter}.</span>}
              {displayLabel}
              {revealed && value === correctAnswer && (
                <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-green-600" />
              )}
              {revealed && value === selected && value !== correctAnswer && (
                <XCircle className="inline-block ml-2 h-4 w-4 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explication */}
      {revealed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="w-full">
              <p className="font-semibold text-blue-800 mb-1">Explication</p>
              <p className="text-blue-700 leading-relaxed">{explanation}</p>
              {source && (
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-blue-500 text-xs font-medium">📎 {source}</p>
                  <a
                    href={buildSourceUrl(source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Lire l'article
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signalement */}
      {revealed && (
        <div className="mt-3">
          {reportState === "idle" && (
            <button
              onClick={() => setReportState("open")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-600 transition-colors mx-auto"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Cette réponse me semble incorrecte
            </button>
          )}

          {reportState === "open" && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-800 mb-3 text-center">
                Que pensez-vous de la réponse de l'outil ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleReport(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 border-green-300 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  L'information est correcte, je m'étais trompée
                </button>
                <button
                  onClick={() => handleReport(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 border-red-300 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  L'information est fausse, l'outil s'est trompé
                </button>
              </div>
            </div>
          )}

          {reportState === "sending" && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Enregistrement…
            </div>
          )}

          {reportState === "done_correct" && (
            <p className="text-xs text-green-600 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Parfait, continuez votre apprentissage !
            </p>
          )}

          {reportState === "done_error" && (
            <p className="text-xs text-orange-600 text-center flex items-center justify-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Signalement enregistré dans Notion — merci !
            </p>
          )}
        </div>
      )}
    </div>
  );
}
