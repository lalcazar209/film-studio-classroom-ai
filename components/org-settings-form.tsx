"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function OrgSettingsForm({
  organizationId,
  initialName,
  initialDistrict,
  initialCdsCode,
}: {
  organizationId: string;
  initialName: string;
  initialDistrict: string;
  initialCdsCode: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [district, setDistrict] = useState(initialDistrict);
  const [cdsCode, setCdsCode] = useState(initialCdsCode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, district, cdsCode }),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">School name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <Label htmlFor="district">District</Label>
        <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="cdsCode">CDS code</Label>
        <Input id="cdsCode" value={cdsCode} onChange={(e) => setCdsCode(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      <Button type="submit" isLoading={isSaving}>
        Save
      </Button>
    </form>
  );
}
