import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import { ArrowRight, Flame, Target, TrendingUp } from "lucide-react";

async function getDashboardData() {
  const [scores, recentSessions] = await Promise.all([
    prisma.competencyScore.findMany(),
    prisma.quizSession.findMany({
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const totalAnswers = scores.reduce((a, s) => a + s.totalAnswers, 0);
  const totalCorrect = scores.reduce((a, s) => a + s.correct, 0);
  const globalScore = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

  // Calcul du streak (jours consécutifs)
  let streak = 0;
  if (recentSessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDays = Array.from(
      new Set(
        recentSessions.map((s) => {
          const d = new Date(s.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      )
    ).sort((a, b) => b - a);

    let current = today.getTime();
    for (const day of sessionDays) {
      if (day === current || day === current - 86400000) {
        streak++;
        current = day - 86400000;
      } else break;
    }
  }

  return { scores, globalScore, totalAnswers, totalCorrect, streak, recentSessions };
}

export default async function Dashboard() {
  const { scores, globalScore, totalAnswers, totalCorrect, streak, recentSessions } =
    await getDashboardData();

  const scoreMap = new Map(scores.map((s) => [s.theme, s]));

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
        <p className="text-muted-foreground mt-1">
          Votre progression RH — Code du travail & Convention collective 0086
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Score global</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{Math.round(globalScore)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{totalCorrect}/{totalAnswers} correctes</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">Questions répondues</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalAnswers}</p>
          <p className="text-xs text-muted-foreground mt-1">depuis le début</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-muted-foreground">Streak</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground mt-1">
            jour{streak > 1 ? "s" : ""} consécutif{streak > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* CTA Quiz */}
      <Link
        href="/quiz"
        className="flex items-center justify-between bg-primary text-white rounded-xl p-5 mb-8 hover:bg-primary/90 transition-colors group"
      >
        <div>
          <p className="font-semibold text-lg">Commencer le quiz du jour</p>
          <p className="text-primary-foreground/80 text-sm mt-0.5">
            Questions générées par IA sur les thèmes RH
          </p>
        </div>
        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Scores par thème */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold mb-4">Scores par thème</h3>
        <div className="space-y-3">
          {THEME_KEYS.map((key) => {
            const s = scoreMap.get(key);
            const score = s?.score ?? 0;
            const color = THEMES[key].color;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{THEMES[key].label}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(score)}%
                    {s && <span className="ml-1 text-xs">({s.totalAnswers} q.)</span>}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${score}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessions récentes */}
      {recentSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Sessions récentes</h3>
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const pct = Math.round((s.correctAnswers / s.totalQuestions) * 100);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {THEMES[s.theme as keyof typeof THEMES]?.label ?? s.theme}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(s.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      pct >= 80
                        ? "text-green-600"
                        : pct >= 60
                        ? "text-amber-600"
                        : "text-red-500"
                    }`}
                  >
                    {pct}% ({s.correctAnswers}/{s.totalQuestions})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
