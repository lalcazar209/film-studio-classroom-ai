"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
import { Input, Label, Textarea } from "@/components/ui/field";

export function SkillsUsaGeneratorForm() {
  const router = useRouter();
  const [contestName, setContestName] = useState("");
  const [studentLevel, setStudentLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/skillsusa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestName,
          studentLevel: studentLevel || undefined,
          notes: notes || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      }
      const { practice } = await response.json();
      router.push(`/teacher/dashboard/skillsusa/${practice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CinemaCard>
      <CinemaCardHeader>
        <CinemaCardTitle>Generate competition practice</CinemaCardTitle>
      </CinemaCardHeader>
      <CinemaCardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label theme="cinema" htmlFor="contestName">Contest</Label>
            <Input
              theme="cinema"
              id="contestName"
              value={contestName}
              onChange={(e) => setContestName(e.target.value)}
              placeholder="e.g. Broadcast News Production, TV/Video Production, Job Interview"
              required
              minLength={3}
            />
          </div>
          <div>
            <Label theme="cinema" htmlFor="studentLevel">Student level (optional)</Label>
            <Input
              theme="cinema"
              id="studentLevel"
              value={studentLevel}
              onChange={(e) => setStudentLevel(e.target.value)}
              placeholder="e.g. first-year competitors"
            />
          </div>
          <div>
            <Label theme="cinema" htmlFor="notes">Notes (optional)</Label>
            <Textarea
              theme="cinema"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Equipment available, focus areas, anything specific to your team..."
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Button variant="cinema" type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Generating practice package..." : "Generate"}
          </Button>
        </form>
      </CinemaCardContent>
    </CinemaCard>
  );
}
