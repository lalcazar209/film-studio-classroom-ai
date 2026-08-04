"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function CoverImagePanel({
  projectId,
  initialCoverImageUrl,
}: {
  projectId: string;
  initialCoverImageUrl: string | null;
}) {
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/cover-image`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Cover image generation failed");
      }
      setCoverImageUrl(data.coverImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      {coverImageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-soft">
          <Image src={coverImageUrl} alt="Project cover" fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={handleGenerate} isLoading={isGenerating}>
          {isGenerating ? "Generating cover image..." : coverImageUrl ? "Regenerate cover image" : "Generate cover image"}
        </Button>
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    </div>
  );
}
