"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Newspaper, ExternalLink, BookmarkCheck, BookmarkPlus } from "lucide-react";
import type { VeilleItem } from "@/app/api/veille/route";

const URGENCE_CONFIG = {
  haute:   { label: "🔴 Action requise",  color: "bg-red-100 text-red-700 border-red-200" },
  moyenne: { label: "🟡 À traiter",        color: "bg-amber-100 text-amber-700 border-amber-200" },
  info:    { label: "🔵 Info",             color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function Veille() {
  const [items, setItems] = useState<VeilleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Record<string, "saving" | "done">>({});

  const loadItems = async () => {
    setLoading(true);
    setError("");
    setSaved({});
    try {
      const res = await fetch("/api/veille");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError("Impossible de charger les actualités.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const handleSave = async (item: VeilleItem) => {
    if (saved[item.id]) return;
    setSaved((s) => ({ ...s, [item.id]: "saving" }));
    try {
      await fetch("/api/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      setSaved((s) => ({ ...s, [item.id]: "done" }));
    } catch {
      setSaved((s) => { const n = { ...s }; delete n[item.id]; return n; });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement des actualités RH de la semaine…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadItems} className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-white rounded-lg text-sm">
          <RefreshCw className="h-4 w-4" /> Réessayer
        </button>
      </div>
    );
  }

  const savedCount = Object.values(saved).filter((v) => v === "done").length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            Veille RH
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Actualités de la semaine — {items.length} articles générés
          </p>
        </div>
        <button
          onClick={loadItems}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {savedCount > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <BookmarkCheck className="h-4 w-4" />
          {savedCount} actualité{savedCount > 1 ? "s" : ""} sauvegardée{savedCount > 1 ? "s" : ""} dans Notion
        </div>
      )}

      {/* Liste des articles */}
      <div className="space-y-4">
        {items.map((item) => {
          const urgence = URGENCE_CONFIG[item.urgence] ?? URGENCE_CONFIG.info;
          const isSaving = saved[item.id] === "saving";
          const isDone = saved[item.id] === "done";

          return (
            <div key={item.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", urgence.color)}>
                  {urgence.label}
                </span>
                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                  {item.theme}
                </span>
              </div>

              {/* Titre */}
              <h3 className="text-base font-bold mb-2 leading-snug">{item.titre}</h3>

              {/* Résumé */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.resume}</p>

              {/* Impact */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-indigo-700 mb-1">💼 Impact pour vous</p>
                <p className="text-sm text-indigo-600 leading-relaxed">{item.impact}</p>
              </div>

              {/* Footer : source + actions */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-muted-foreground">📎 {item.source}</p>

                <div className="flex items-center gap-2">
                  {/* Lien article */}
                  {item.lien && (
                    <a
                      href={item.lien}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      En lire plus
                    </a>
                  )}

                  {/* Sauvegarder dans Notion */}
                  <button
                    onClick={() => handleSave(item)}
                    disabled={isSaving || isDone}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                      isDone
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isDone ? (
                      <BookmarkCheck className="h-3 w-3" />
                    ) : (
                      <BookmarkPlus className="h-3 w-3" />
                    )}
                    {isDone ? "Sauvegardé" : "Sauvegarder dans Notion"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
