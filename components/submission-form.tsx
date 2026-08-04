"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { VideoUpload } from "@/components/video-upload";

export function SubmissionForm({
  submissionId,
  initialVideoUrl,
  initialReflection,
}: {
  submissionId: string;
  initialVideoUrl: string | null;
  initialReflection: string | null;
}) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "");
  const [reflection, setReflection] = useState(initialReflection ?? "");
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          reflection: reflection || undefined,
          selfAssess: notes ? { rating, notes } : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Submission failed");
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass =
    "!border-cinema-border !bg-cinema-black/40 !text-cinema-white placeholder:!text-cinema-muted focus:!border-cinema-red focus:!ring-cinema-red/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="videoUrl" className="text-cinema-white">
          Video link (YouTube, Vimeo, Drive share link, etc.)
        </Label>
        <Input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
          placeholder="https://..."
          className={fieldClass}
        />
      </div>
      <VideoUpload submissionId={submissionId} onUploaded={(secureUrl) => setVideoUrl(secureUrl)} />
      <div>
        <Label htmlFor="reflection" className="text-cinema-white">
          Reflection
        </Label>
        <Textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What worked, what you'd change next time..."
          className={fieldClass}
        />
      </div>
      <div>
        <Label htmlFor="rating" className="text-cinema-white">
          Self-assessment (1-5)
        </Label>
        <Input
          id="rating"
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className={`w-20 ${fieldClass}`}
        />
      </div>
      <div>
        <Label htmlFor="notes" className="text-cinema-white">
          Self-assessment notes
        </Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-600 dark:text-green-400">Submitted! Added to your portfolio.</p>}

      <Button type="submit" variant="cinema" isLoading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
