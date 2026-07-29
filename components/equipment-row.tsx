"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface EquipmentRowData {
  id: string;
  name: string;
  assetTag: string;
  status: string;
  qrDataUrl: string;
  activeCheckout: { id: string; borrowerName: string; dueAt: string | null } | null;
}

export function EquipmentRow({ item, users }: { item: EquipmentRowData; users: UserOption[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [dueAt, setDueAt] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/equipment/${item.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Checkout failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReturn() {
    if (!item.activeCheckout) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/equipment/checkouts/${item.activeCheckout.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damageNotes: damageNotes || undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Return failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-start gap-4 border-b border-studio-ink/10 py-4 dark:border-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URI QR code, not an optimizable remote asset */}
      <img src={item.qrDataUrl} alt={`QR code for ${item.assetTag}`} width={72} height={72} />

      <div className="flex-1">
        <p className="font-medium">
          {item.name} <span className="text-xs text-studio-ink/50 dark:text-white/50">({item.assetTag})</span>
        </p>
        <p className="text-xs text-studio-ink/50 dark:text-white/50">Status: {item.status}</p>

        {item.activeCheckout ? (
          <div className="mt-2 space-y-2">
            <p className="text-sm">
              Checked out to <strong>{item.activeCheckout.borrowerName}</strong>
              {item.activeCheckout.dueAt && ` · due ${item.activeCheckout.dueAt}`}
            </p>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Damage notes (optional)"
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="secondary" onClick={handleReturn} isLoading={isSubmitting}>
                Return
              </Button>
            </div>
          </div>
        ) : item.status === "AVAILABLE" ? (
          <div className="mt-2 flex items-center gap-2">
            <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="max-w-xs">
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </Select>
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="max-w-40" />
            <Button onClick={handleCheckout} isLoading={isSubmitting} disabled={!userId}>
              Check out
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-studio-ink/50 dark:text-white/50">Not available for checkout.</p>
        )}

        {error && (
          <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
