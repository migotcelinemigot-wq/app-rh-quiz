"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QuizCard from "@/components/QuizCard";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import type { QuestionType } from "@/lib/claude";
import { CheckCircle2, XCircle, RotateCcw, Home, Trophy } from "lucide-react";

interface RevisionQuestion {
  id: number; // QuizAnswer ID — pour suppression si réussi
  questionText: string;
  options: string[];
  type: string;
  correctAnswer: string;
  theme: string;
}

interface AnswerRecord {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function RevisionSession() {
  const router = useRouter();
  const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
  const [theme, setTheme] = useState<string>("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    const stored = sessionStorage.getItem("revisionQuestions");
    const storedTheme = sessionStorage.getItem("revisionTheme");
    if (!stored) {
      router.push("/revisions");
      return;
    }
    setQuestions(JSON.parse(stored));
    if (storedTheme) setTheme(storedTheme);
    questionStartRef.current = Date.now();
  }, [router]);

  const handleAnswer = (userAnswer: string, isCorrect: boolean) => {
    const q = questions[current];
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, questionText: q.questionText, userAnswer, correctAnswer: q.correctAnswer, isCorrect },
    ]);
  };

  const handleNext = async () => {
    const record = answers[answers.length - 1];

    // Si bonne réponse → supprimer de la liste des erreurs
    if (record?.isCorrect) {
      await fetch(`/api/revisions/wrong-answers/${record.questionId}`, {
        method: "DELETE",
      }).catch(() => {/* non bloquant */});
    }

    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      questionStartRef.current = Date.now();
    } else {
      setFinished(true);
    }
  };

  if (!questions.length) return null;

  const mastered = answers.filter((a) => a.isCorrect).length;
  const stillWrong = answers.filter((a) => !a.isCorrect).length;
  const themeLabel = THEMES[theme as ThemeKey]?.label ?? theme;
  const themeColor = THEMES[theme as ThemeKey]?.color ?? "#6366f1";

  // ── Écran de résultats ────────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-border p-8 text-center mb-6">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-amber-400" />
          <h2 className="text-2xl font-bold mb-1">Révision terminée !</h2>
          <p className="text-muted-foreground text-sm mb-6">{themeLabel}</p>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{mastered}</div>
              <p className="text-xs text-muted-foreground mt-1">Maîtrisées ✅<br />supprimées des révisions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{stillWrong}</div>
              <p className="text-xs text-muted-foreground mt-1">À retravailler ❌<br />restent dans révisions</p>
            </div>
          </div>

          {mastered > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4">
              🎉 {mastered} question{mastered > 1 ? "s" : ""} supprimée{mastered > 1 ? "s" : ""} de ta liste de révision !
            </div>
          )}
        </div>

        {/* Récap */}
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 className="font-semibold mb-3 text-sm">Récapitulatif</h3>
          <div className="space-y-2">
            {answers.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                {a.isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-muted-foreground line-clamp-2">{a.questionText}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/revisions")}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Retour révisions
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

  // Construire un objet compatible avec QuizCard
  // Si options vides (ancienne question sans options stockées) → on affiche juste la bonne réponse
  const hasOptions = q.options && q.options.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: themeColor }} />
          <span className="text-sm font-medium text-muted-foreground">
            Révision — {themeLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Question {current + 1} / {questions.length}
        </p>
      </div>

      {hasOptions ? (
        // Mode quiz normal avec QuizCard
        <>
          <QuizCard
            key={q.id}
            questionNumber={current + 1}
            totalQuestions={questions.length}
            type={(q.type ?? "QCM") as QuestionType}
            question={q.questionText}
            options={q.options}
            correctAnswer={q.correctAnswer}
            explanation=""
            source=""
            theme={themeLabel}
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
        </>
      ) : (
        // Mode flashcard pour les anciennes questions sans options
        <FlashCard
          question={q}
          questionNumber={current + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          onNext={handleNext}
          answered={currentAnswered}
        />
      )}
    </div>
  );
}

// ── Composant flashcard pour questions sans options ───────────────────────────

function FlashCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  answered,
}: {
  question: RevisionQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onNext: () => void;
  answered: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => setRevealed(true);

  const handleJudge = (isCorrect: boolean) => {
    onAnswer(isCorrect ? question.correctAnswer : "—", isCorrect);
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      {/* Question */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground mb-2">
          {questionNumber} / {totalQuestions}
        </div>
        <p className="text-lg font-medium leading-snug">{question.questionText}</p>
      </div>

      {!revealed ? (
        <button
          onClick={handleReveal}
          className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          Voir la réponse
        </button>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-green-600 font-medium mb-1">Bonne réponse</p>
            <p className="text-sm font-semibold text-green-800">{question.correctAnswer}</p>
          </div>

          {!answered ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleJudge(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                J'avais faux
              </button>
              <button
                onClick={() => handleJudge(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-green-200 text-green-600 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                J'avais bon
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={onNext}
                className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {questionNumber < totalQuestions ? "Question suivante" : "Voir les résultats"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
