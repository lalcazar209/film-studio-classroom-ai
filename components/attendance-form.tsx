"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@prisma/client";

interface StudentRow {
  id: string;
  name: string | null;
  email: string;
  status: AttendanceStatus;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "TARDY", "EXCUSED"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-600 text-white",
  ABSENT: "bg-red-600 text-white",
  TARDY: "bg-amber-500 text-white",
  EXCUSED: "bg-blue-600 text-white",
};

export function AttendanceForm({
  classPeriodId,
  date,
  initialStudents,
}: {
  classPeriodId: string;
  date: string;
  initialStudents: StudentRow[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
    setSaved(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classPeriodId,
          date,
          entries: students.map((s) => ({ studentId: s.id, status: s.status })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not save attendance");
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
    <div className="space-y-4">
      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {students.map((student) => (
          <li key={student.id} className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm">{student.name ?? student.email}</span>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus(student.id, status)}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    student.status === status ? STATUS_STYLES[status] : "bg-studio-ink/5 dark:bg-white/10"
                  }`}
                >
                  {status[0]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

      <Button onClick={handleSave} isLoading={isSaving}>
        Save attendance
      </Button>
    </div>
  );
}
