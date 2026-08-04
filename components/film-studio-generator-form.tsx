"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";

/** Shared across Teacher and Mentor portals — see AssistantsDirectory for
 * why `theme` is opt-in per caller. */
export function FilmStudioGeneratorForm({ basePath, theme = "default" }: { basePath: string; theme?: "default" | "cinema" }) {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [genre, setGenre] = useState("");
  const [castSize, setCastSize] = useState("");
  const [shootDays, setShootDays] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/film-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          genre,
          castSize: castSize ? Number(castSize) : undefined,
          shootDays: shootDays ? Number(shootDays) : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      }
      const { project } = await response.json();
      router.push(`${basePath}/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCinema = theme === "cinema";
  const [SectionCard, SectionHeader, SectionTitle, SectionContent] = isCinema
    ? [CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent]
    : [Card, CardHeader, CardTitle, CardContent];

  return (
    <SectionCard>
      <SectionHeader>
        <SectionTitle>Generate a production package</SectionTitle>
        <p className={cn("mt-1 text-sm", isCinema ? "text-cinema-muted" : "text-studio-ink/60 dark:text-white/60")}>
          Screenplay, shot list, call sheet, budget, equipment list, location plan, casting
          sheet, and marketing plan — all at once.
        </p>
      </SectionHeader>
      <SectionContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="concept" theme={theme}>
              Concept
            </Label>
            <Textarea
              id="concept"
              theme={theme}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="A short documentary about a local small business surviving a tough year..."
              required
              minLength={10}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="genre" theme={theme}>
                Genre
              </Label>
              <Input id="genre" theme={theme} value={genre} onChange={(e) => setGenre(e.target.value)} required placeholder="Documentary" />
            </div>
            <div>
              <Label htmlFor="castSize" theme={theme}>
                Cast size
              </Label>
              <Input id="castSize" theme={theme} type="number" min={1} value={castSize} onChange={(e) => setCastSize(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="shootDays" theme={theme}>
                Shoot days
              </Label>
              <Input id="shootDays" theme={theme} type="number" min={1} value={shootDays} onChange={(e) => setShootDays(e.target.value)} />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" variant={isCinema ? "cinema" : "primary"} isLoading={isSubmitting}>
            {isSubmitting ? "Generating production package..." : "Generate"}
          </Button>
        </form>
      </SectionContent>
    </SectionCard>
  );
}
