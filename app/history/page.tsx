import { prisma } from "@/lib/prisma";
import { THEMES } from "@/lib/themes";
import ProgressChart from "@/components/ProgressChart";

async function getHistory() {
  const sessions = await prisma.quizSession.findMany({
    orderBy: { date: "asc" },
    take: 100,
  });
  return sessions;
}

export default async function History() {
  const sessions = await getHistory();
  const reversed = [...sessions].reverse();

  const chartData = sessions.map((s) => ({
    date: s.date.toISOString(),
    score: (s.correctAnswers / s.totalQuestions) * 100,
    theme: s.theme,
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Historique</h2>
        <p className="text-muted-foreground mt-1">
          Toutes vos sessions de quiz
        </p>
      </div>

      {/* Graphe */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold mb-4">Courbe de progression</h3>
        <ProgressChart data={chartData} />
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">
          {sessions.length} session{sessions.length > 1 ? "s" : ""}
        </h3>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Aucune session pour l&apos;instant — lancez votre premier quiz !
          </p>
        ) : (
          <div className="space-y-2">
            {reversed.map((s) => {
              const pct = Math.round((s.correctAnswers / s.totalQuestions) * 100);
              const themeLabel =
                THEMES[s.theme as keyof typeof THEMES]?.label ?? s.theme;
              const themeColor =
                THEMES[s.theme as keyof typeof THEMES]?.color ?? "#6366f1";
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: themeColor }}
                    />
                    <div>
                      <p className="text-sm font-medium">{themeLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {s.durationSec > 0 && `${Math.round(s.durationSec / 60)} min · `}
                        {s.totalQuestions} questions
                      </p>
                    </div>
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
                    {pct}%
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({s.correctAnswers}/{s.totalQuestions})
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
