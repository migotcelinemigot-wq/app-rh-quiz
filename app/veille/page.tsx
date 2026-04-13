"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check, X, RefreshCw, BookmarkCheck, Newspaper, ExternalLink } from "lucide-react";
import type { VeilleItem } from "@/app/api/veille/route";

const URGENCE_CONFIG = {
  haute:   { label: "🔴 Action requise",   color: "bg-red-100 text-red-700 border-red-200" },
  moyenne: { label: "🟡 À traiter",         color: "bg-amber-100 text-amber-700 border-amber-200" },
  info:    { label: "🔵 Info",              color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function Veille() {
  const [items, setItems] = useState<VeilleItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kept, setKept] = useState<VeilleItem[]>([]);
  const [skipped, setSkipped] = useState<VeilleItem[]>([]);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    setIndex(0);
    setKept([]);
    setSkipped([]);
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

  const current = items[index];
  const isFinished = index >= items.length && items.length > 0;

  const handleKeep = async () => {
    if (!current || saving) return;
    setAnimating("right");
    setSaving(true);
    try {
      await fetch("/api/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: current }),
      });
      setKept((k) => [...k, current]);
    } finally {
      setSaving(false);
      setTimeout(() => { setAnimating(null); setIndex((i) => i + 1); }, 300);
    }
  };

  const handleSkip = () => {
    if (!current) return;
    setAnimating("left");
    setSkipped((s) => [...s, current]);
    setTimeout(() => { setAnimating(null); setIndex((i) => i + 1); }, 300);
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement des actualités RH de la semaine…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadItems} className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-white rounded-lg text-sm">
          <RefreshCw className="h-4 w-4" /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Veille RH</h2>
        <p className="text-muted-foreground mt-1">
          Actualités de la semaine — Gardez ce qui vous concerne
        </p>
      </div>

      {/* Compteur */}
      {!isFinished && (
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>{index + 1} / {items.length}</span>
          <div className="flex gap-1">
            {items.map((_, i) => (
              <div key={i} className={cn("h-1.5 w-8 rounded-full",
                i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-border")} />
            ))}
          </div>
          <span className="flex items-center gap-1 text-green-600">
            <BookmarkCheck className="h-3.5 w-3.5" />{kept.length} gardée{kept.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Carte courante */}
      {!isFinished && current && (
        <div className={cn(
          "bg-white rounded-2xl border-2 border-border shadow-sm p-6 mb-6 transition-all duration-300",
          animating === "right" && "translate-x-8 opacity-0 rotate-2",
          animating === "left" && "-translate-x-8 opacity-0 -rotate-2"
        )}>
          {/* Badge urgence */}
          <div className="flex items-center justify-between mb-4">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border",
              URGENCE_CONFIG[current.urgence].color)}>
              {URGENCE_CONFIG[current.urgence].label}
            </span>
            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
              {current.theme}
            </span>
          </div>

          {/* Titre */}
          <h3 className="text-lg font-bold mb-3 leading-snug">{current.titre}</h3>

          {/* Résumé */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{current.resume}</p>

          {/* Impact */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1">💼 Impact pour vous</p>
            <p className="text-sm text-indigo-600 leading-relaxed">{current.impact}</p>
          </div>

          {/* Source + Lien */}
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            {current.source && (
              <p className="text-xs text-muted-foreground">📎 {current.source}</p>
            )}
            {current.lien && (
              <a
                href={current.lien}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                En lire plus
              </a>
            )}
          </div>
        </div>
      )}

      {/* Boutons Tinder */}
      {!isFinished && current && (
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            disabled={!!animating}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
            Pas concernée
          </button>
          <button
            onClick={handleKeep}
            disabled={!!animating || saving}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            Je garde l'info
          </button>
        </div>
      )}

      {/* Écran de fin */}
      {isFinished && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <Newspaper className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Veille terminée !</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {kept.length > 0
              ? `${kept.length} actualité${kept.length > 1 ? "s" : ""} sauvegardée${kept.length > 1 ? "s" : ""} dans votre Notion`
              : "Aucune actualité gardée cette semaine"}
          </p>

          {/* Récap */}
          {kept.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-green-700 mb-2">✅ Gardées dans Notion</p>
              <ul className="space-y-2">
                {kept.map((k) => (
                  <li key={k.id} className="text-xs text-green-600 flex items-center justify-between gap-2">
                    <span>• {k.titre}</span>
                    {k.lien && (
                      <a
                        href={k.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 font-semibold shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Lire
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={loadItems}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
            <RefreshCw className="h-4 w-4" /> Nouvelles actualités
          </button>
        </div>
      )}
    </div>
  );
}
