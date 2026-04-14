"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QuizCard from "@/components/QuizCard";
import type { NotionQuestion } from "@/lib/notion";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import type { QuestionType } from "@/lib/claude";
import { CheckCircle2, XCircle, RotateCcw, Home } from "lucide-react";

interface AnswerRecord {
  notionQuestionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function QuizSession() {
  const router = useRouter();
  const [questions, setQuestions] = useState<NotionQuestion[]>([]);
  const [theme, setTheme] = useState<ThemeKey>("DROIT_TRAVAIL");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    const stored = sessionStorage.getItem("quizQuestions");
    const storedTheme = sessionStorage.getItem("quizTheme");
    if (!stored) {
      router.push("/quiz");
      return;
    }
    setQuestions(JSON.parse(stored));
    if (storedTheme) setTheme(storedTheme as ThemeKey);
    sessionStartRef.current = Date.now();
    questionStartRef.current = Date.now();
  }, [router]);

  const handleAnswer = (userAnswer: string, isCorrect: boolean, timeSpent: number) => {
    const q = questions[current];
    const record: AnswerRecord = {
      notionQuestionId: q.id,
      questionText: q.question,
      userAnswer,
      correctAnswer: q.answer,
      isCorrect,
      timeSpent,
    };
    setAnswers((prev) => [...prev, record]);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      questionStartRef.current = Date.now();
    } else {
      setFinished(true);
      saveSession([...answers]);
    }
  };

  const saveSession = async (finalAnswers: AnswerRecord[]) => {
    setSaving(true);
    const durationSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const correctAnswers = finalAnswers.filter((a) => a.isCorrect).length;

    try {
      await fetch("/api/quiz/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          totalQuestions: finalAnswers.length,
          correctAnswers,
          durationSec,
          answers: finalAnswers,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!questions.length) return null;

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const score = finished ? Math.round((correctCount / answers.length) * 100) : 0;

  // Résultats
  if (finished) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-border p-8 text-center mb-6">
          <div
            className={`text-6xl font-bold mb-2 ${
              score >= 80
                ? "text-green-500"
                : score >= 60
                ? "text-amber-500"
                : "text-red-500"
            }`}
          >
            {score}%
          </div>
          <p className="text-lg font-semibold mb-1">
            {correctCount} / {answers.length} bonnes réponses
          </p>
          <p className="text-muted-foreground text-sm">
            {THEMES[theme]?.label ?? theme}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {saving ? "Sauvegarde en cours…" : "Session sauvegardée"}
          </p>
        </div>

        {/* Récapitulatif */}
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h3 className="font-semibold mb-4">Récapitulatif</h3>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                {a.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {a.questionText}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/quiz")}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Nouveau quiz
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const currentAnswered = answers.length > current;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: THEMES[theme]?.color ?? "#6366f1" }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {THEMES[theme]?.label ?? theme}
          </span>
        </div>
      </div>

      <QuizCard
        key={q.id}
        questionNumber={current + 1}
        totalQuestions={questions.length}
        type={(q.type ?? "QCM") as QuestionType}
        question={q.question}
        options={q.options}
        correctAnswer={q.answer}
        explanation={q.explanation}
        source={q.source}
        theme={THEMES[theme]?.label ?? theme}
        onAnswer={handleAnswer}
        startTime={questionStartRef.current}
      />

      {currentAnswered && (
        <div className="mt-6 text-center">
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            {current < questions.length - 1 ? "Question suivante" : "Voir les résultats"}
          </button>
        </div>
      )}
    </div>
  );
}
