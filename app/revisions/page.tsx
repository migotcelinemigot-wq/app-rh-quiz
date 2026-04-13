import { prisma } from "@/lib/prisma";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import RevisionTrigger from "./RevisionTrigger";

async function getWeakThemes() {
  const scores = await prisma.competencyScore.findMany();
  const scoreMap = new Map(scores.map((s) => [s.theme, s]));

  return THEME_KEYS.map((key) => {
    const s = scoreMap.get(key);
    return {
      theme: key,
      label: THEMES[key].label,
      color: THEMES[key].color,
      score: s?.score ?? 0,
      totalAnswers: s?.totalAnswers ?? 0,
      needsRevision: (s?.score ?? 0) < 70 && (s?.totalAnswers ?? 0) > 0,
    };
  });
}

export default async function Revisions() {
  const themes = await getWeakThemes();
  const weakThemes = themes.filter((t) => t.needsRevision);
  const untested = themes.filter((t) => t.totalAnswers === 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Fiches de révision</h2>
        <p className="text-muted-foreground mt-1">
          Générées automatiquement pour les thèmes avec score &lt; 70%
        </p>
      </div>

      {/* Thèmes à réviser */}
      {weakThemes.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-red-600">
            À réviser ({weakThemes.length})
          </h3>
          <div className="space-y-3">
            {weakThemes.map((t) => (
              <div
                key={t.theme}
                className="bg-white rounded-xl border border-red-200 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Score : {Math.round(t.score)}% — {t.totalAnswers} questions
                      </p>
                    </div>
                  </div>
                  <RevisionTrigger theme={t.theme} label={t.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
          <p className="font-semibold text-green-700">
            {themes.filter((t) => t.totalAnswers > 0).length > 0
              ? "Excellent ! Tous vos thèmes sont au-dessus de 70%"
              : "Aucune donnée pour l'instant"}
          </p>
          <p className="text-sm text-green-600 mt-1">
            Continuez à vous entraîner pour maintenir ce niveau.
          </p>
        </div>
      )}

      {/* Scores de tous les thèmes */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">État de tous les thèmes</h3>
        <div className="space-y-3">
          {themes.map((t) => (
            <div key={t.theme}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-sm text-muted-foreground">
                  {t.totalAnswers === 0 ? (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Non testé</span>
                  ) : (
                    <>{Math.round(t.score)}%</>
                  )}
                </span>
              </div>
              {t.totalAnswers > 0 && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${t.score}%`,
                      backgroundColor: t.score < 70 ? "#ef4444" : t.color,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {untested.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            {untested.length} thème{untested.length > 1 ? "s" : ""} non encore testés.
          </p>
        )}
      </div>
    </div>
  );
}
