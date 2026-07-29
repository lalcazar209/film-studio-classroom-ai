"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

interface ClipOption {
  submissionId: string;
  title: string;
  videoUrl: string;
}

export function DemoReelBuilder({
  availableClips,
  initialTitle,
  initialSelectedIds,
}: {
  availableClips: ClipOption[];
  initialTitle: string;
  initialSelectedIds: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(submissionId: string) {
    setSelected((prev) =>
      prev.includes(submissionId) ? prev.filter((id) => id !== submissionId) : [...prev, submissionId],
    );
    setSaved(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const clips = selected
        .map((id) => availableClips.find((c) => c.submissionId === id))
        .filter((c): c is ClipOption => Boolean(c));

      const response = await fetch("/api/students/me/demo-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, clips }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not save demo reel");
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
      <div>
        <Label htmlFor="title">Reel title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {availableClips.length === 0 ? (
        <p className="text-sm text-studio-ink/60 dark:text-white/60">
          No submitted work with a video link yet — submit a project first.
        </p>
      ) : (
        <ul className="space-y-2">
          {availableClips.map((clip) => (
            <li key={clip.submissionId} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(clip.submissionId)}
                onChange={() => toggle(clip.submissionId)}
              />
              <a href={clip.videoUrl} target="_blank" rel="noreferrer" className="text-sm hover:text-studio-accent">
                {clip.title}
              </a>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

      <Button onClick={handleSave} isLoading={isSaving} disabled={selected.length === 0}>
        Save demo reel
      </Button>
    </div>
  );
}
