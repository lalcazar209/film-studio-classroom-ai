"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { VideoReview } from "@/lib/ai/schemas";

const CATEGORY_LABELS: Record<string, string> = {
  storytelling: "Storytelling",
  composition: "Composition",
  lighting: "Lighting",
  exposure: "Exposure",
  whiteBalance: "White Balance",
  audio: "Audio",
  editing: "Editing",
  pacing: "Pacing",
  graphics: "Graphics",
  professionalism: "Professionalism",
};

export function VideoReviewPanel({
  submissionId,
  initialReview,
  hasVideo,
}: {
  submissionId: string;
  initialReview: VideoReview | null;
  hasVideo: boolean;
}) {
  const router = useRouter();
  const [review, setReview] = useState(initialReview);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/review`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Review failed");
      }
      const { review: result } = await response.json();
      setReview(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="cinema-secondary" onClick={handleRun} isLoading={isRunning} disabled={!hasVideo}>
        {review ? "Re-run AI Review" : "Run AI Review"}
      </Button>
      {!hasVideo && <p className="text-xs text-cinema-muted">No video submitted yet.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {review && (
        <div className="space-y-3 rounded-2xl border border-cinema-border bg-cinema-panel/70 p-4 text-sm shadow-cinema-panel backdrop-blur">
          <p className="font-medium text-cinema-white">
            Overall: {review.overallScore}/10
            {!review.analyzedVisualFrames && (
              <span className="ml-2 text-xs text-amber-500">
                (metadata only — no video frames analyzed)
              </span>
            )}
          </p>
          <p className="text-cinema-white/70">{review.overallSummary}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const category = review[key as keyof VideoReview] as { score: number; feedback: string };
              return (
                <div key={key}>
                  <p className="font-medium text-cinema-white">
                    {label}: {category.score}/10
                  </p>
                  <p className="text-xs text-cinema-muted">{category.feedback}</p>
                </div>
              );
            })}
          </div>

          {review.copyrightConcerns.length > 0 && (
            <div>
              <p className="font-medium text-cinema-red">Copyright concerns</p>
              <ul className="list-inside list-disc text-xs text-cinema-white/80">
                {review.copyrightConcerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="font-medium text-cinema-white">Next steps</p>
            <ul className="list-inside list-disc text-xs text-cinema-white/80">
              {review.nextSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
