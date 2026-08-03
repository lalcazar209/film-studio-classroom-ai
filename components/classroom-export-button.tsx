"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClassroomExportButton({
  exportUrl,
  initialClassroomUrl,
}: {
  exportUrl: string;
  initialClassroomUrl: string | null;
}) {
  const [classroomUrl, setClassroomUrl] = useState(initialClassroomUrl);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePush() {
    setIsPushing(true);
    setError(null);
    try {
      const response = await fetch(exportUrl, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Push to Classroom failed");
      }
      const data = await response.json();
      setClassroomUrl(data.classroomUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPushing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={handlePush} isLoading={isPushing}>
        {isPushing ? "Pushing to Classroom..." : classroomUrl ? "Re-push to Classroom" : "Push to Google Classroom"}
      </Button>
      {classroomUrl && (
        <a href={classroomUrl} target="_blank" rel="noreferrer" className="text-sm text-studio-accent hover:underline">
          Open in Classroom
        </a>
      )}
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
