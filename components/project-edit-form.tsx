"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";

export interface LessonData {
  id: string;
  day: string;
  title: string;
  objective: string;
  iCanStatement: string;
  differentiation: { accommodations: string[]; extensions: string[]; interventions: string[] };
}

export interface RubricCriterion {
  name: string;
  weightPercent: number;
  levels: { label: string; points: number; description: string }[];
}

export interface QuizQuestion {
  prompt: string;
  type: "multiple_choice" | "short_answer" | "true_false";
  choices?: string[];
  answer: string;
  standardCode?: string;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ProjectEditForm({
  projectId,
  initialLessons,
  initialRubric,
  initialQuiz,
}: {
  projectId: string;
  initialLessons: LessonData[];
  initialRubric: { title: string; criteria: RubricCriterion[] };
  initialQuiz: { title: string; questions: QuizQuestion[] };
}) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [rubric, setRubric] = useState(initialRubric);
  const [quiz, setQuiz] = useState(initialQuiz);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateLesson(id: string, updates: Partial<LessonData>) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    setSaved(false);
  }

  function updateCriterion(index: number, updates: Partial<RubricCriterion>) {
    setRubric((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    }));
    setSaved(false);
  }

  function updateQuestion(index: number, updates: Partial<QuizQuestion>) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    }));
    setSaved(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessons: lessons.map((l) => ({
            id: l.id,
            objective: l.objective,
            iCanStatement: l.iCanStatement,
            differentiation: l.differentiation,
          })),
          rubric,
          quiz,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardHeader>
            <CardTitle>
              {DAY_LABELS[lesson.day] ?? lesson.day}: {lesson.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Objective</Label>
              <Textarea
                value={lesson.objective}
                onChange={(e) => updateLesson(lesson.id, { objective: e.target.value })}
              />
            </div>
            <div>
              <Label>&quot;I can&quot; statement</Label>
              <Textarea
                value={lesson.iCanStatement}
                onChange={(e) => updateLesson(lesson.id, { iCanStatement: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Accommodations (one per line)</Label>
                <Textarea
                  value={lesson.differentiation.accommodations.join("\n")}
                  onChange={(e) =>
                    updateLesson(lesson.id, {
                      differentiation: { ...lesson.differentiation, accommodations: linesToArray(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label>Extensions (one per line)</Label>
                <Textarea
                  value={lesson.differentiation.extensions.join("\n")}
                  onChange={(e) =>
                    updateLesson(lesson.id, {
                      differentiation: { ...lesson.differentiation, extensions: linesToArray(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label>Interventions (one per line)</Label>
                <Textarea
                  value={lesson.differentiation.interventions.join("\n")}
                  onChange={(e) =>
                    updateLesson(lesson.id, {
                      differentiation: { ...lesson.differentiation, interventions: linesToArray(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Rubric — {rubric.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rubric.criteria.map((criterion, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                value={criterion.name}
                onChange={(e) => updateCriterion(i, { name: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                value={criterion.weightPercent}
                onChange={(e) => updateCriterion(i, { weightPercent: Number(e.target.value) })}
                className="w-20"
              />
              <span className="text-sm text-studio-ink/50 dark:text-white/50">%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz — {quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((question, i) => (
            <div key={i} className="space-y-1 border-b border-studio-ink/10 pb-3 dark:border-white/10">
              <Textarea value={question.prompt} onChange={(e) => updateQuestion(i, { prompt: e.target.value })} />
              <Label>Answer</Label>
              <Input value={question.answer} onChange={(e) => updateQuestion(i, { answer: e.target.value })} />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

      <Button onClick={handleSave} isLoading={isSaving}>
        Save changes
      </Button>
    </div>
  );
}
