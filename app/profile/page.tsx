import { prisma } from "@/lib/prisma";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import ScoreRadar from "@/components/ScoreRadar";

async function getProfile() {
  const [scores, sessionsCount] = await Promise.all([
    prisma.competencyScore.findMany(),
    prisma.quizSession.count(),
  ]);

  const totalAnswers = scores.reduce((a, s) => a + s.totalAnswers, 0);
  const totalCorrect = scores.reduce((a, s) => a + s.correct, 0);
  const globalScore = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

  const bestTheme = scores.reduce(
    (best, s) => (s.score > (best?.score ?? -1) ? s : best),
    null as (typeof scores)[0] | null
  );

  const worstTheme = scores
    .filter((s) => s.totalAnswers > 0)
    .reduce(
      (worst, s) => (s.score < (worst?.score ?? 101) ? s : worst),
      null as (typeof scores)[0] | null
    );

  return { scores, sessionsCount, totalAnswers, globalScore, bestTheme, worstTheme };
}

export default async function Profile() {
  const { scores, sessionsCount, totalAnswers, globalScore, bestTheme, worstTheme } =
    await getProfile();

  const scoreMap = new Map(scores.map((s) => [s.theme, s]));
  const radarData = THEME_KEYS.map((key) => ({
    theme: key,
    label: THEMES[key].label,
    score: scoreMap.get(key)?.score ?? 0,
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Profil de compétences</h2>
        <p className="text-muted-foreground mt-1">
          Vue d&apos;ensemble de votre maîtrise des thèmes RH
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="text-3xl font-bold text-primary">{Math.round(globalScore)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Score global</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="text-3xl font-bold">{sessionsCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Sessions réalisées</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="text-3xl font-bold">{totalAnswers}</p>
          <p className="text-xs text-muted-foreground mt-1">Questions répondues</p>
        </div>
      </div>

      {/* Radar */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold mb-2">Radar de compétences</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Basé sur vos réponses — 7 thèmes RH
        </p>
        {totalAnswers === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Commencez un quiz pour voir votre radar de compétences
          </div>
        ) : (
          <ScoreRadar data={radarData} />
        )}
      </div>

      {/* Points forts / faibles */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {bestTheme && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-xs text-green-600 font-medium mb-1">Point fort</p>
            <p className="font-semibold text-green-800">
              {THEMES[bestTheme.theme as keyof typeof THEMES]?.label ?? bestTheme.theme}
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {Math.round(bestTheme.score)}%
            </p>
          </div>
        )}
        {worstTheme && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-xs text-red-600 font-medium mb-1">À renforcer</p>
            <p className="font-semibold text-red-800">
              {THEMES[worstTheme.theme as keyof typeof THEMES]?.label ?? worstTheme.theme}
            </p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {Math.round(worstTheme.score)}%
            </p>
          </div>
        )}
      </div>

      {/* Détail par thème */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Détail par thème</h3>
        <div className="divide-y divide-border">
          {THEME_KEYS.map((key) => {
            const s = scoreMap.get(key);
            const score = s?.score ?? 0;
            return (
              <div key={key} className="py-3 flex items-center gap-4">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: THEMES[key].color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{THEMES[key].label}</p>
                  {s ? (
                    <p className="text-xs text-muted-foreground">
                      {s.correct}/{s.totalAnswers} correctes
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Non testé</p>
                  )}
                </div>
                <div className="flex items-center gap-3 w-32">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score}%`, backgroundColor: THEMES[key].color }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">
                    {s ? `${Math.round(score)}%` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
