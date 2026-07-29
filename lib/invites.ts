import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

const INVITE_TTL_DAYS = 7;

export class InviteError extends Error {}

export interface CreateInviteInput {
  organizationId: string;
  createdById: string;
  email: string;
  role: Role;
  /** Required when role is PARENT — the existing student this parent should be linked to. */
  studentId?: string;
}

export async function createInvite(input: CreateInviteInput) {
  const email = input.email.trim().toLowerCase();

  if (input.role === "PARENT" && !input.studentId) {
    throw new InviteError("A student must be selected for a parent invite");
  }

  if (input.studentId) {
    const student = await db.user.findFirst({
      where: { id: input.studentId, organizationId: input.organizationId, role: "STUDENT" },
      select: { id: true },
    });
    if (!student) {
      throw new InviteError("Selected student was not found in this organization");
    }
  }

  const existingUser = await db.user.findUnique({ where: { email }, select: { organizationId: true } });
  if (existingUser?.organizationId && existingUser.organizationId !== input.organizationId) {
    throw new InviteError("This email already belongs to a member of a different organization");
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return db.invite.create({
    data: {
      organizationId: input.organizationId,
      createdById: input.createdById,
      email,
      role: input.role,
      studentId: input.studentId,
      token,
      expiresAt,
    },
  });
}

export type AcceptInviteResult =
  | { ok: true; role: Role }
  | { ok: false; reason: "not_found" | "expired" | "already_accepted" | "email_mismatch" };

export async function acceptInvite(token: string, userId: string, userEmail: string): Promise<AcceptInviteResult> {
  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite) return { ok: false, reason: "not_found" };
  if (invite.acceptedAt) return { ok: false, reason: "already_accepted" };
  if (invite.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (invite.email !== userEmail.trim().toLowerCase()) return { ok: false, reason: "email_mismatch" };

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role: invite.role, organizationId: invite.organizationId },
    });

    if (invite.role === "PARENT" && invite.studentId) {
      await tx.parentLink.upsert({
        where: { parentId_studentId: { parentId: userId, studentId: invite.studentId } },
        update: {},
        create: { parentId: userId, studentId: invite.studentId },
      });
    }

    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  });

  return { ok: true, role: invite.role };
}
