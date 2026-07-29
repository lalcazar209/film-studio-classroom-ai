"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [cdsCode, setCdsCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, district: district || undefined, cdsCode: cdsCode || undefined }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not create organization");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">School / program name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <Label htmlFor="district">District (optional)</Label>
        <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="cdsCode">CDS code (optional)</Label>
        <Input id="cdsCode" value={cdsCode} onChange={(e) => setCdsCode(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting}>
        Create organization
      </Button>
    </form>
  );
}
