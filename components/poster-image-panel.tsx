"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function PosterImagePanel({
  filmStudioProjectId,
  initialPosterImageUrl,
}: {
  filmStudioProjectId: string;
  initialPosterImageUrl: string | null;
}) {
  const [posterImageUrl, setPosterImageUrl] = useState(initialPosterImageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/film-studio/${filmStudioProjectId}/poster-image`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Poster generation failed");
      }
      setPosterImageUrl(data.posterImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      {posterImageUrl && (
        <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-xl shadow-soft">
          <Image src={posterImageUrl} alt="Poster concept art" fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="cinema-secondary" onClick={handleGenerate} isLoading={isGenerating} className="px-2 py-1 text-xs">
          {isGenerating ? "Generating poster..." : posterImageUrl ? "Regenerate poster art" : "Generate poster art"}
        </Button>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    </div>
  );
}
