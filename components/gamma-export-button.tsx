"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GammaExportButton({ exportUrl, initialGammaUrl }: { exportUrl: string; initialGammaUrl: string | null }) {
  const [gammaUrl, setGammaUrl] = useState(initialGammaUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(exportUrl, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Gamma export failed");
      }
      const data = await response.json();
      setGammaUrl(data.gammaUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="cinema-secondary" onClick={handleExport} isLoading={isGenerating}>
        {isGenerating ? "Generating in Gamma (can take a minute)..." : gammaUrl ? "Regenerate in Gamma" : "Export to Gamma"}
      </Button>
      {gammaUrl && (
        <a href={gammaUrl} target="_blank" rel="noreferrer" className="text-sm text-cinema-red hover:underline">
          View presentation
        </a>
      )}
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
