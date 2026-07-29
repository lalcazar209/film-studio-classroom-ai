"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/field";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["STUDENT", "TEACHER", "ADMIN", "PARENT", "MENTOR"];

export function UserManagementRow({
  user,
  isSelf,
}: {
  user: { id: string; name: string | null; email: string; role: Role; isActive: boolean };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateUser(updates: { role?: Role; isActive?: boolean }) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setRole(user.role);
      setIsActive(user.isActive);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <tr className="border-b border-black/5 dark:border-white/5">
      <td className="py-2 pr-4">{user.name ?? user.email}</td>
      <td className="py-2 pr-4">
        <Select
          value={role}
          disabled={isSaving}
          onChange={(e) => {
            const newRole = e.target.value as Role;
            setRole(newRole);
            updateUser({ role: newRole });
          }}
          className="text-xs"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </td>
      <td className="py-2 pr-4">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isActive}
            disabled={isSaving || isSelf}
            onChange={(e) => {
              const value = e.target.checked;
              setIsActive(value);
              updateUser({ isActive: value });
            }}
          />
          Active
        </label>
      </td>
      <td className="py-2 text-xs text-red-600 dark:text-red-400">{error}</td>
    </tr>
  );
}
