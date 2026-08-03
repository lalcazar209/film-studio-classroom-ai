"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

interface Course {
  id: string;
  name: string;
  section: string | null;
}

interface ImportResult {
  courseName: string;
  studentsCreated: number;
  studentsMatched: number;
  skipped: number;
  enrolled: number;
}

export function GoogleClassroomRosterImport({
  classPeriodId,
  initialCourseId,
}: {
  classPeriodId: string;
  initialCourseId: string | null;
}) {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId ?? "");
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsConnection, setNeedsConnection] = useState(false);

  async function loadCourses() {
    setIsLoadingCourses(true);
    setError(null);
    setNeedsConnection(false);
    try {
      const response = await fetch("/api/integrations/google-classroom/courses");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 400) setNeedsConnection(true);
        throw new Error(typeof data.error === "string" ? data.error : "Could not load courses");
      }
      setCourses(data.courses);
      if (!selectedCourseId && data.courses[0]) setSelectedCourseId(data.courses[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoadingCourses(false);
    }
  }

  async function handleImport() {
    if (!selectedCourseId) return;
    setIsImporting(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/integrations/google-classroom/import-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, classPeriodId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Import failed");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-3">
      {courses === null ? (
        <Button variant="secondary" onClick={loadCourses} isLoading={isLoadingCourses}>
          Load my Google Classroom courses
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="max-w-xs"
          >
            {courses.length === 0 && <option value="">No active courses found</option>}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
                {course.section ? ` (${course.section})` : ""}
              </option>
            ))}
          </Select>
          <Button onClick={handleImport} isLoading={isImporting} disabled={!selectedCourseId}>
            Import roster
          </Button>
        </div>
      )}

      {needsConnection && (
        <p className="text-sm text-studio-ink/60 dark:text-white/60">
          Connect Google Classroom first from{" "}
          <Link href="/admin/dashboard/integrations" className="font-semibold text-studio-accent hover:underline">
            Integrations
          </Link>
          .
        </p>
      )}
      {error && !needsConnection && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {result && (
        <p className="text-sm text-studio-mint">
          Imported &ldquo;{result.courseName}&rdquo;: {result.studentsCreated} new students,{" "}
          {result.studentsMatched} matched to existing accounts, {result.enrolled} enrolled
          {result.skipped > 0 ? `, ${result.skipped} skipped` : ""}.
        </p>
      )}
    </div>
  );
}
