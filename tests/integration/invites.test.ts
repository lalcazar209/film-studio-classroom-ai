import { describe, expect, it, beforeAll, afterAll, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createInvite, acceptInvite, InviteError } from "@/lib/invites";
import { createOrganization, OrganizationError } from "@/lib/organizations";

const db = new PrismaClient();
let orgId: string;
let adminId: string;
let teacherId: string;
let studentId: string;
const createdUserIds: string[] = [];
const createdInviteIds: string[] = [];

beforeAll(async () => {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@demo.filmstudioclassroom.ai" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });
  const student = await db.user.findFirstOrThrow({ where: { organizationId: org.id, role: "STUDENT" } });
  orgId = org.id;
  adminId = admin.id;
  teacherId = teacher.id;
  studentId = student.id;
});

afterAll(async () => {
  await db.$disconnect();
});

afterEach(async () => {
  if (createdInviteIds.length) await db.invite.deleteMany({ where: { id: { in: createdInviteIds } } });
  if (createdUserIds.length) await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdInviteIds.length = 0;
  createdUserIds.length = 0;
});

describe("createOrganization", () => {
  it("rejects a user who already belongs to an organization", async () => {
    await expect(createOrganization({ creatorUserId: adminId, name: "Should Fail" })).rejects.toBeInstanceOf(OrganizationError);
  });
});

describe("invite lifecycle", () => {
  it("a teacher invite can be created and accepted, promoting the user and setting their org", async () => {
    const email = `vitest-teacher-${Date.now()}@example.com`;
    const invite = await createInvite({ organizationId: orgId, createdById: adminId, email, role: "TEACHER" });
    createdInviteIds.push(invite.id);

    const user = await db.user.create({ data: { email, role: "STUDENT" } });
    createdUserIds.push(user.id);

    const result = await acceptInvite(invite.token, user.id, email);
    expect(result).toEqual({ ok: true, role: "TEACHER" });

    const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.role).toBe("TEACHER");
    expect(updated.organizationId).toBe(orgId);
  });

  it("rejects accepting an already-accepted invite", async () => {
    const email = `vitest-teacher2-${Date.now()}@example.com`;
    const invite = await createInvite({ organizationId: orgId, createdById: adminId, email, role: "TEACHER" });
    createdInviteIds.push(invite.id);
    const user = await db.user.create({ data: { email, role: "STUDENT" } });
    createdUserIds.push(user.id);

    await acceptInvite(invite.token, user.id, email);
    const second = await acceptInvite(invite.token, user.id, email);
    expect(second).toEqual({ ok: false, reason: "already_accepted" });
  });

  it("rejects a parent invite with no student specified", async () => {
    await expect(
      createInvite({ organizationId: orgId, createdById: adminId, email: "x@example.com", role: "PARENT" }),
    ).rejects.toBeInstanceOf(InviteError);
  });

  it("accepting a parent invite creates the ParentLink to the specified student", async () => {
    const email = `vitest-parent-${Date.now()}@example.com`;
    const invite = await createInvite({ organizationId: orgId, createdById: teacherId, email, role: "PARENT", studentId });
    createdInviteIds.push(invite.id);
    const user = await db.user.create({ data: { email, role: "STUDENT" } });
    createdUserIds.push(user.id);

    await acceptInvite(invite.token, user.id, email);

    const link = await db.parentLink.findUnique({ where: { parentId_studentId: { parentId: user.id, studentId } } });
    expect(link).not.toBeNull();
    await db.parentLink.deleteMany({ where: { parentId: user.id } });
  });

  it("rejects acceptance from a session whose email doesn't match the invite", async () => {
    const email = `vitest-mismatch-${Date.now()}@example.com`;
    const invite = await createInvite({ organizationId: orgId, createdById: adminId, email, role: "TEACHER" });
    createdInviteIds.push(invite.id);
    const user = await db.user.create({ data: { email: `different-${email}` } });
    createdUserIds.push(user.id);

    const result = await acceptInvite(invite.token, user.id, `different-${email}`);
    expect(result).toEqual({ ok: false, reason: "email_mismatch" });
  });
});
