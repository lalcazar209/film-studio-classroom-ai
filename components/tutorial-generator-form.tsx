"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { TUTORIAL_CATEGORY_OPTIONS } from "@/lib/constants/tutorial-categories";
import type { TutorialCategory } from "@prisma/client";

export function TutorialGeneratorForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<TutorialCategory>(TUTORIAL_CATEGORY_OPTIONS[0]!.value);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/video-academy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category, notes: notes || undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      }
      const { tutorial } = await response.json();
      router.push(`/teacher/dashboard/video-academy/${tutorial.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a tutorial</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Three-point lighting basics"
              required
              minLength={3}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as TutorialCategory)}>
              {TUTORIAL_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything specific to emphasize, equipment available, student level..."
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Generating tutorial..." : "Generate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
