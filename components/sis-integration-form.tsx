"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function SisIntegrationForm({ initialBaseUrl }: { initialBaseUrl?: string }) {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [schoolSisId, setSchoolSisId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<{ sectionCount: number; studentCount: number } | null>(null);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/sis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, apiSecret }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not save");
      }
      setSaved(true);
      setApiKey("");
      setApiSecret("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePreview() {
    setIsPreviewing(true);
    setError(null);
    setPreview(null);
    try {
      const response = await fetch("/api/integrations/sis/preview-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolSisId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Preview failed");
      }
      const data = await response.json();
      setPreview({ sectionCount: data.sectionCount, studentCount: data.studentCount });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <Label htmlFor="ic-baseUrl">Campus base URL</Label>
          <Input
            id="ic-baseUrl"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://yourdistrict.infinitecampus.org"
            required
          />
        </div>
        <div>
          <Label htmlFor="ic-apiKey">API key</Label>
          <Input id="ic-apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="ic-apiSecret">API secret</Label>
          <Input
            id="ic-apiSecret"
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
        <Button type="submit" isLoading={isSaving}>
          Save credentials
        </Button>
      </form>

      <div className="flex items-end gap-2 border-t border-studio-ink/10 pt-4 dark:border-white/10">
        <div className="flex-1">
          <Label htmlFor="ic-schoolId">School SIS ID (to test)</Label>
          <Input id="ic-schoolId" value={schoolSisId} onChange={(e) => setSchoolSisId(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={handlePreview} isLoading={isPreviewing} disabled={!schoolSisId}>
          Preview roster
        </Button>
      </div>
      {preview && (
        <p className="text-sm text-studio-ink/70 dark:text-white/70">
          {preview.sectionCount} sections, {preview.studentCount} students found.
        </p>
      )}
    </div>
  );
}
