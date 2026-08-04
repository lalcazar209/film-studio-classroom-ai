"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface StoryboardShot {
  number: number;
  description: string;
  shotType: string;
  movement: string;
  lighting: string;
  audio: string;
  durationSec: number;
  imageUrl?: string;
}

function ShotCard({ projectId, shot }: { projectId: string; shot: StoryboardShot }) {
  const [imageUrl, setImageUrl] = useState(shot.imageUrl ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/storyboard/shots/${shot.number}/image`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Image generation failed");
      }
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-studio-ink/[0.06] p-3 dark:border-white/10">
      {imageUrl && (
        <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-xl">
          <Image src={imageUrl} alt={`Shot ${shot.number}`} fill className="object-cover" unoptimized />
        </div>
      )}
      <p className="text-sm">
        <span className="font-semibold">Shot {shot.number} — {shot.shotType}: </span>
        {shot.description}
      </p>
      <p className="mt-1 text-xs text-studio-ink/50 dark:text-white/50">
        {shot.movement} · {shot.lighting} · {shot.audio} · {shot.durationSec}s
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Button variant="ghost" onClick={handleGenerate} isLoading={isGenerating} className="px-2 py-1 text-xs">
          {isGenerating ? "Generating..." : imageUrl ? "Regenerate image" : "Generate image"}
        </Button>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    </div>
  );
}

export function StoryboardShots({ projectId, shots }: { projectId: string; shots: StoryboardShot[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {shots.map((shot) => (
        <ShotCard key={shot.number} projectId={projectId} shot={shot} />
      ))}
    </div>
  );
}
