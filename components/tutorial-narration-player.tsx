"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { NarratedSegment } from "@/lib/ai/video-narration-service";

/**
 * A narrated, synced "slideshow" — each segment's TTS audio plays through a
 * native <audio> element while its visualGuide text is shown as the current
 * slide; onEnded auto-advances to the next segment's audio. This is
 * deliberately not a rendered video file (see the AskUserQuestion decision
 * in this feature's PR): cheap, uses the existing OpenAI key, and needs no
 * server-side video encoding.
 */
export function TutorialNarrationPlayer({
  tutorialId,
  initialSegments,
  initialNarrationGenerated,
  canGenerate,
  theme = "default",
}: {
  tutorialId: string;
  initialSegments: NarratedSegment[];
  initialNarrationGenerated: boolean;
  /** Only teachers/admins can trigger generation — students just play it back. */
  canGenerate: boolean;
  /** Shared across Teacher and Student portals — see AssistantsDirectory for
   * why this is opt-in per caller. */
  theme?: "default" | "cinema";
}) {
  const isCinema = theme === "cinema";
  const [segments, setSegments] = useState(initialSegments);
  const [narrationGenerated, setNarrationGenerated] = useState(initialNarrationGenerated);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Tracks whether the user has actually started playback, so a segment
  // change never triggers a browser-blocked autoplay on first mount.
  const hasStartedRef = useRef(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/video-academy/${tutorialId}/narration`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Narration generation failed");
      }
      setSegments(data.tutorial.segments as NarratedSegment[]);
      setNarrationGenerated(true);
      setCurrentIndex(0);
      hasStartedRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  function goToSegment(index: number) {
    if (index < 0 || index >= segments.length) return;
    hasStartedRef.current = true;
    setCurrentIndex(index);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasStartedRef.current) return;
    audio.load();
    void audio.play();
  }, [currentIndex]);

  function handleEnded() {
    if (currentIndex < segments.length - 1) {
      goToSegment(currentIndex + 1);
    }
  }

  const secondaryVariant = isCinema ? "cinema-secondary" : "secondary";

  if (!narrationGenerated) {
    if (!canGenerate) {
      return (
        <p className={cn("text-sm", isCinema ? "text-cinema-muted" : "text-studio-ink/60 dark:text-white/60")}>
          Narration audio hasn&apos;t been generated for this tutorial yet.
        </p>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant={secondaryVariant} onClick={handleGenerate} isLoading={isGenerating}>
          {isGenerating ? "Generating narration audio..." : "Generate narration audio"}
        </Button>
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  }

  const currentSegment = segments[currentIndex];
  if (!currentSegment) return null;

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border p-4",
        isCinema
          ? "border-cinema-border bg-cinema-black/40 shadow-cinema-panel"
          : "border-studio-ink/10 bg-studio-paper shadow-soft dark:border-white/10",
      )}
    >
      <p className={cn("text-xs font-bold uppercase tracking-wide", isCinema ? "text-cinema-red" : "text-studio-accent")}>
        Segment {currentIndex + 1} of {segments.length}
      </p>
      <p className={cn("text-base font-medium", isCinema && "text-cinema-white")}>{currentSegment.visualGuide}</p>
      <p className={cn("text-sm", isCinema ? "text-cinema-muted" : "text-studio-ink/70 dark:text-white/70")}>
        {currentSegment.narration}
      </p>

      <audio
        ref={audioRef}
        src={currentSegment.audioUrl}
        onEnded={handleEnded}
        onPlay={() => {
          hasStartedRef.current = true;
        }}
        className="w-full"
        controls
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={secondaryVariant} onClick={() => goToSegment(currentIndex - 1)} disabled={currentIndex === 0}>
          Previous
        </Button>
        <Button
          variant={secondaryVariant}
          onClick={() => goToSegment(currentIndex + 1)}
          disabled={currentIndex === segments.length - 1}
        >
          Next
        </Button>
        {canGenerate && (
          <Button variant={secondaryVariant} onClick={handleGenerate} isLoading={isGenerating}>
            Regenerate narration
          </Button>
        )}
      </div>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
