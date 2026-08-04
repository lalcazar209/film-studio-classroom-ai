"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GoogleDocsExportButton({
  exportUrl,
  initialGoogleDocUrl,
}: {
  exportUrl: string;
  initialGoogleDocUrl: string | null;
}) {
  const [googleDocUrl, setGoogleDocUrl] = useState(initialGoogleDocUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(exportUrl, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Google Docs export failed");
      }
      const data = await response.json();
      setGoogleDocUrl(data.googleDocUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="cinema-secondary" onClick={handleExport} isLoading={isGenerating}>
        {isGenerating ? "Creating Google Doc..." : googleDocUrl ? "Regenerate Google Doc" : "Export to Google Docs"}
      </Button>
      {googleDocUrl && (
        <a href={googleDocUrl} target="_blank" rel="noreferrer" className="text-sm text-cinema-red hover:underline">
          Open doc
        </a>
      )}
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
