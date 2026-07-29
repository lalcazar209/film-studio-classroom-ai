"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";

interface TeacherOption {
  id: string;
  name: string | null;
  email: string;
}

const GRADE_LEVELS = ["9", "10", "11", "12", "ADULT", "COLLEGE"];

export function ClassPeriodForm({ teachers }: { teachers: TeacherOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [gradeLevel, setGradeLevel] = useState(GRADE_LEVELS[0]!);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/class-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, period: period || undefined, gradeLevel, teacherId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not create class period");
      }
      setName("");
      setPeriod("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Class name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <Label htmlFor="period">Period (optional)</Label>
          <Input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gradeLevel">Grade level</Label>
          <Select id="gradeLevel" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="teacherId">Teacher</Label>
          {teachers.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">No teachers yet — invite one first.</p>
          ) : (
            <Select id="teacherId" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name ?? t.email}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting} disabled={!teacherId}>
        Create class period
      </Button>
    </form>
  );
}
