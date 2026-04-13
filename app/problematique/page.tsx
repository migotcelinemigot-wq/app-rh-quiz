"use client";

import { useState } from "react";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { MessageSquare, Loader2, RefreshCw, AlertCircle } from "lucide-react";

export default function Problematique() {
  const [problematique, setProblematique] = useState("");
  const [theme, setTheme] = useState<ThemeKey | "">("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const canSubmit = problematique.trim().length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/problematique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme || undefined, problematique }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data.content);
    } catch {
      setError("Impossible d'analyser la problématique. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.match(/^#{1,2}\s/)) return <h3 key={i} className="text-base font-bold mt-5 mb-2 text-foreground">{line.replace(/^#+\s/, "")}</h3>;
      if (line.match(/^\*\*[^*]+\*\*$/)) return <p key={i} className="font-semibold mt-4 mb-1">{line.replace(/\*\*/g, "")}</p>;
      if (line.match(/^\d+\.\s/)) return <p key={i} className="text-sm font-medium mt-3 mb-1">{line}</p>;
      if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="ml-4 text-sm text-muted-foreground leading-relaxed">{line.slice(2)}</li>;
      if (!line.trim()) return <br key={i} />;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
    });

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Ma problématique</h2>
        <p className="text-muted-foreground mt-1">
          Décrivez votre situation RH et obtenez une analyse juridique personnalisée
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          Les réponses sont générées par IA sur la base du Code du travail et de la CC 0086.
          Consultez un juriste ou avocat pour toute décision engageant votre entreprise.
        </p>
      </div>

      {/* Zone de saisie */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h3 className="font-semibold mb-1">Décrivez votre situation</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Plus vous êtes précise, plus la réponse sera adaptée à votre contexte
        </p>
        <textarea
          value={problematique}
          onChange={(e) => setProblematique(e.target.value)}
          placeholder={`Exemples :
• Un salarié en CDI est absent depuis 3 semaines sans justificatif. Quelles sont mes obligations et comment gérer cette situation ?
• Je dois licencier un salarié pour motif économique dans mon agence de publicité (CC 0086). Quelles sont les étapes et délais à respecter ?
• Mon employé demande un congé parental. Quels sont ses droits et mes obligations selon la CC 0086 ?`}
          rows={7}
          className="w-full border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary leading-relaxed"
        />
        <div className="flex justify-between mt-2">
          <p className={cn("text-xs", canSubmit ? "text-green-600" : "text-muted-foreground")}>
            {canSubmit ? "✓ Prête à être analysée" : `Minimum 20 caractères (${problematique.length}/20)`}
          </p>
          <p className="text-xs text-muted-foreground">{problematique.length} caractères</p>
        </div>
      </div>

      {/* Thème */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold mb-1">
          Thème associé <span className="text-muted-foreground font-normal text-sm">(optionnel)</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Aide l'IA à cibler son analyse</p>
        <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey | "")}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white">
          <option value="">Détection automatique</option>
          {THEME_KEYS.map((k) => <option key={k} value={k}>{THEMES[k].label}</option>)}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      <button onClick={handleSubmit} disabled={loading || !canSubmit}
        className={cn("w-full py-4 rounded-xl font-semibold text-white transition-all mb-6 flex items-center justify-center gap-2",
          loading || !canSubmit ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90")}>
        {loading
          ? <><Loader2 className="h-5 w-5 animate-spin" />Analyse juridique en cours…</>
          : <><MessageSquare className="h-5 w-5" />Analyser ma problématique</>}
      </button>

      {/* Résultat */}
      {result && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Analyse & recommandations
            </h3>
            <button onClick={handleSubmit}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Régénérer
            </button>
          </div>

          {/* Problématique rappelée */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-muted-foreground italic border border-border">
            &laquo; {problematique.slice(0, 150)}{problematique.length > 150 ? "…" : ""} &raquo;
          </div>

          <div>{formatContent(result)}</div>
        </div>
      )}
    </div>
  );
}
