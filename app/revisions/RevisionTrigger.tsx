"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";

export default function RevisionTrigger({
  theme,
  label,
}: {
  theme: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <ExternalLink className="h-3 w-3" />
        Créée dans Notion
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCreate}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        Créer la fiche Notion
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
