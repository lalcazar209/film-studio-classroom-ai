"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";

interface TeacherOption {
  id: string;
  name: string | null;
  email: string;
}

interface StudentOption {
  id: string;
  name: string | null;
  email: string;
}

const GRADE_LEVELS = ["9", "10", "11", "12", "ADULT", "COLLEGE"];

export function ClassPeriodEditor({
  classPeriodId,
  initialName,
  initialPeriod,
  initialGradeLevel,
  initialTeacherId,
  teachers,
  enrolledStudents,
  availableStudents,
}: {
  classPeriodId: string;
  initialName: string;
  initialPeriod: string;
  initialGradeLevel: string;
  initialTeacherId: string;
  teachers: TeacherOption[];
  enrolledStudents: StudentOption[];
  availableStudents: StudentOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [period, setPeriod] = useState(initialPeriod);
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel);
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [studentToAdd, setStudentToAdd] = useState(availableStudents[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/class-periods/${classPeriodId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, period, gradeLevel, teacherId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnroll() {
    if (!studentToAdd) return;
    setIsEnrolling(true);
    setError(null);
    try {
      const response = await fetch(`/api/class-periods/${classPeriodId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentToAdd }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Enroll failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleUnenroll(studentId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/class-periods/${classPeriodId}/enrollments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Unenroll failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="period">Period</Label>
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
            <Select id="teacherId" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name ?? t.email}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div>
        <h3 className="mb-2 font-medium">Roster</h3>
        <ul className="mb-3 space-y-1 text-sm">
          {enrolledStudents.map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span>{s.name ?? s.email}</span>
              <button
                type="button"
                onClick={() => handleUnenroll(s.id)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {availableStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={studentToAdd} onChange={(e) => setStudentToAdd(e.target.value)} className="max-w-xs">
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? s.email}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={handleEnroll} isLoading={isEnrolling}>
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
