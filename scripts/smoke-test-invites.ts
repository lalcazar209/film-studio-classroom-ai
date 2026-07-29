import { PrismaClient } from "@prisma/client";
import { createOrganization, OrganizationError } from "../lib/organizations";
import { createInvite, acceptInvite, InviteError } from "../lib/invites";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@demo.filmstudioclassroom.ai" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });
  const student = await db.user.findFirstOrThrow({ where: { organizationId: org.id, role: "STUDENT" } });

  // 1. A user who already belongs to an org cannot bootstrap a new one.
  try {
    await createOrganization({ creatorUserId: admin.id, name: "Should Fail Academy" });
    throw new Error("expected OrganizationError");
  } catch (e) {
    await assert(e instanceof OrganizationError, "createOrganization rejects users who already have an org");
  }

  // 2. Teacher invite: create + accept, role/org updated.
  const newTeacherEmail = `smoketest-teacher-${Date.now()}@example.com`;
  const teacherInvite = await createInvite({
    organizationId: org.id,
    createdById: admin.id,
    email: newTeacherEmail,
    role: "TEACHER",
  });

  const newTeacherUser = await db.user.create({ data: { email: newTeacherEmail, role: "STUDENT" } });
  const acceptResult = await acceptInvite(teacherInvite.token, newTeacherUser.id, newTeacherEmail);
  await assert(acceptResult.ok && acceptResult.role === "TEACHER", "teacher invite accepts and returns TEACHER role");

  const promoted = await db.user.findUniqueOrThrow({ where: { id: newTeacherUser.id } });
  await assert(promoted.role === "TEACHER" && promoted.organizationId === org.id, "teacher user promoted with correct org");

  // 3. Re-accepting the same token fails cleanly.
  const secondAccept = await acceptInvite(teacherInvite.token, newTeacherUser.id, newTeacherEmail);
  await assert(!secondAccept.ok && secondAccept.reason === "already_accepted", "double-accept is rejected");

  // 4. Parent invite requires a valid studentId in the org.
  try {
    await createInvite({ organizationId: org.id, createdById: admin.id, email: "x@example.com", role: "PARENT" });
    throw new Error("expected InviteError");
  } catch (e) {
    await assert(e instanceof InviteError, "parent invite without studentId is rejected");
  }

  // 5. Parent invite: create + accept, ParentLink created.
  const newParentEmail = `smoketest-parent-${Date.now()}@example.com`;
  const parentInvite = await createInvite({
    organizationId: org.id,
    createdById: teacher.id,
    email: newParentEmail,
    role: "PARENT",
    studentId: student.id,
  });
  const newParentUser = await db.user.create({ data: { email: newParentEmail, role: "STUDENT" } });

  // Wrong-email acceptance attempt should fail before we try the right one.
  const wrongEmailResult = await acceptInvite(parentInvite.token, newParentUser.id, "someone-else@example.com");
  await assert(!wrongEmailResult.ok && wrongEmailResult.reason === "email_mismatch", "email mismatch is rejected");

  const parentAccept = await acceptInvite(parentInvite.token, newParentUser.id, newParentEmail);
  await assert(parentAccept.ok && parentAccept.role === "PARENT", "parent invite accepts");

  const link = await db.parentLink.findUnique({
    where: { parentId_studentId: { parentId: newParentUser.id, studentId: student.id } },
  });
  await assert(link !== null, "ParentLink created between invited parent and target student");

  // Cleanup so re-running this script stays idempotent.
  await db.parentLink.deleteMany({ where: { parentId: newParentUser.id } });
  await db.invite.deleteMany({ where: { id: { in: [teacherInvite.id, parentInvite.id] } } });
  await db.user.deleteMany({ where: { id: { in: [newTeacherUser.id, newParentUser.id] } } });

  console.log("\nAll invite/organization smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
