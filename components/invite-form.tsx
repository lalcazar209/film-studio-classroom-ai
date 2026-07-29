"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
  { value: "PARENT", label: "Parent" },
  { value: "MENTOR", label: "Industry Mentor" },
  { value: "ADMIN", label: "Admin" },
];

interface StudentOption {
  id: string;
  name: string | null;
  email: string;
}

export function InviteForm({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInviteLink(null);

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          studentId: role === "PARENT" ? studentId : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not create invite");
      }

      const { invite } = await response.json();
      setInviteLink(`${window.location.origin}/invite/${invite.token}`);
      setEmail("");
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {role === "PARENT" && (
        <div>
          <Label htmlFor="studentId">Link to student</Label>
          {students.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">
              No students in your organization yet.
            </p>
          ) : (
            <Select id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name ?? student.email}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {inviteLink && (
        <p className="break-all rounded-lg bg-studio-ink/5 p-3 text-sm dark:bg-white/10">
          Invite link: <span className="font-mono">{inviteLink}</span>
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} disabled={role === "PARENT" && students.length === 0}>
        Create invite
      </Button>
    </form>
  );
}
