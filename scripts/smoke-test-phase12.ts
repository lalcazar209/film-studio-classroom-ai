/**
 * Covers Phase 12 (Admin Portal) against the real seeded database: class
 * period CRUD, enrollment management, user role/active management with
 * its safety guards, and CSV report generation.
 */
import { PrismaClient } from "@prisma/client";
import {
  createClassPeriod,
  updateClassPeriod,
  deleteClassPeriod,
  enrollStudent,
  unenrollStudent,
  ClassPeriodError,
} from "../lib/class-periods";
import { changeUserRole, setUserActive, UserManagementError } from "../lib/user-management";
import { generateRosterCsv, generateStandardsCoverageCsv } from "../lib/reports";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@demo.filmstudioclassroom.ai" } });
  const student = await db.user.findFirstOrThrow({ where: { organizationId: org.id, role: "STUDENT" } });

  // --- Class period CRUD ---
  const classPeriod = await createClassPeriod({
    organizationId: org.id,
    teacherId: teacher.id,
    name: "Smoke Test Class",
    gradeLevel: "11",
  });
  await assert(classPeriod.name === "Smoke Test Class", "class period is created with the given name");

  const updated = await updateClassPeriod(classPeriod.id, org.id, { name: "Renamed Class" });
  await assert(updated.name === "Renamed Class", "class period name updates");

  try {
    await createClassPeriod({ organizationId: org.id, teacherId: student.id, name: "x", gradeLevel: "9" });
    throw new Error("expected ClassPeriodError");
  } catch (e) {
    await assert(e instanceof ClassPeriodError, "creating a class period with a non-teacher user as teacher is rejected");
  }

  // --- Enrollment ---
  await enrollStudent(classPeriod.id, org.id, student.id);
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_classPeriodId: { studentId: student.id, classPeriodId: classPeriod.id } },
  });
  await assert(enrollment !== null, "enrolling a student creates an Enrollment row");

  // Deleting a class period with enrollments must be rejected -- history stays intact.
  try {
    await deleteClassPeriod(classPeriod.id, org.id);
    throw new Error("expected ClassPeriodError");
  } catch (e) {
    await assert(e instanceof ClassPeriodError, "deleting a class period with enrolled students is rejected");
  }

  await unenrollStudent(classPeriod.id, org.id, student.id);
  const afterUnenroll = await db.enrollment.findUnique({
    where: { studentId_classPeriodId: { studentId: student.id, classPeriodId: classPeriod.id } },
  });
  await assert(afterUnenroll === null, "unenrolling removes the Enrollment row");

  // Now it can be deleted.
  await deleteClassPeriod(classPeriod.id, org.id);
  const gone = await db.classPeriod.findUnique({ where: { id: classPeriod.id } });
  await assert(gone === null, "a class period with no history can be deleted");

  // --- User management guards ---
  const testTeacher = await db.user.create({
    data: { email: `smoketest-role-${Date.now()}@example.com`, role: "TEACHER", organizationId: org.id },
  });

  const promoted = await changeUserRole(org.id, testTeacher.id, "ADMIN", admin.id);
  await assert(promoted.role === "ADMIN", "an admin can change another user's role");

  // With testTeacher now also an ADMIN, the seeded admin is no longer the
  // sole admin, so demoting them should succeed -- then demote testTeacher
  // back down so the self-demotion guard below is tested under the
  // condition it's meant to catch (admin.id being the *only* admin).
  await changeUserRole(org.id, testTeacher.id, "TEACHER", admin.id);
  try {
    await changeUserRole(org.id, admin.id, "TEACHER", admin.id);
    throw new Error("expected UserManagementError");
  } catch (e) {
    await assert(e instanceof UserManagementError, "the sole admin cannot demote themselves");
  }

  try {
    await setUserActive(org.id, admin.id, false, admin.id);
    throw new Error("expected UserManagementError");
  } catch (e) {
    await assert(e instanceof UserManagementError, "a user cannot deactivate their own account");
  }

  const deactivated = await setUserActive(org.id, testTeacher.id, false, admin.id);
  await assert(deactivated.isActive === false, "an admin can deactivate another user");

  await db.user.delete({ where: { id: testTeacher.id } });

  // --- Reports ---
  const rosterCsv = await generateRosterCsv(org.id);
  await assert(rosterCsv.startsWith("Class Period,Grade Level,Teacher,Student Name,Student Email"), "roster CSV has the expected header row");
  await assert(rosterCsv.split("\n").length > 1, "roster CSV includes at least one data row from the seeded org");

  const standardsCsv = await generateStandardsCoverageCsv(org.id);
  await assert(
    standardsCsv.startsWith("Framework,Standard Code,Description,Project,Class Period"),
    "standards coverage CSV has the expected header row",
  );

  console.log("\nAll Phase 12 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
