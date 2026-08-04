"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { PROJECT_CATEGORY_OPTIONS } from "@/lib/constants/project-categories";
import type { ProjectCategory } from "@prisma/client";

interface ClassPeriodOption {
  id: string;
  name: string;
  gradeLevel: string;
}

export function ProjectGeneratorForm({ classPeriods }: { classPeriods: ClassPeriodOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ProjectCategory>(PROJECT_CATEGORY_OPTIONS[0]!.value);
  const [classPeriodId, setClassPeriodId] = useState(classPeriods[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, classPeriodId, brief }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      }

      const { project } = await response.json();
      router.push(`/teacher/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CinemaCard>
      <CinemaCardHeader>
        <CinemaCardTitle>Generate a Project</CinemaCardTitle>
        <p className="mt-1 text-sm text-cinema-muted">
          One brief becomes a full Monday–Friday PBL week: lessons, rubric, quiz, vocabulary,
          storyboard, and production plan — standards-aligned automatically.
        </p>
      </CinemaCardHeader>
      <CinemaCardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label theme="cinema" htmlFor="title">Project title</Label>
            <Input
              theme="cinema"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="30-Second Recycling PSA"
              required
              minLength={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label theme="cinema" htmlFor="category">Category</Label>
              <Select
                theme="cinema"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              >
                {PROJECT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label theme="cinema" htmlFor="classPeriod">Class period</Label>
              <Select
                theme="cinema"
                id="classPeriod"
                value={classPeriodId}
                onChange={(e) => setClassPeriodId(e.target.value)}
                required
              >
                {classPeriods.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} (Grade {cp.gradeLevel})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label theme="cinema" htmlFor="brief">Brief</Label>
            <Textarea
              theme="cinema"
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the assignment, audience, constraints, and any standards focus..."
              required
              minLength={10}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button variant="cinema" type="submit" isLoading={isSubmitting} disabled={!classPeriodId}>
            {isSubmitting ? "Generating full project week..." : "Generate Project"}
          </Button>
        </form>
      </CinemaCardContent>
    </CinemaCard>
  );
}
