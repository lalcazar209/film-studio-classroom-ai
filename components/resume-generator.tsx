"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ResumeContent } from "@/lib/ai/resume-service";

export function ResumeGenerator({ initialResume }: { initialResume: ResumeContent | null }) {
  const router = useRouter();
  const [resume, setResume] = useState(initialResume);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/students/me/resume", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not generate resume");
      }
      const { resume: generated } = await response.json();
      setResume(generated.metadata as ResumeContent);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="cinema" onClick={handleGenerate} isLoading={isGenerating}>
        {resume ? "Regenerate resume" : "Generate resume"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {resume && (
        <article className="space-y-4 rounded-xl border border-cinema-border bg-cinema-panel/70 p-6 text-cinema-white backdrop-blur">
          <p>{resume.summary}</p>
          <div>
            <h3 className="font-medium">Skills</h3>
            <p className="text-sm text-cinema-muted">{resume.skills.join(" · ")}</p>
          </div>
          <div>
            <h3 className="font-medium">Experience</h3>
            <ul className="space-y-2 text-sm">
              {resume.experience.map((exp, i) => (
                <li key={i}>
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-cinema-muted">{exp.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Education</h3>
            <p className="text-sm text-cinema-muted">{resume.education}</p>
          </div>
        </article>
      )}
    </div>
  );
}
