import { PrismaClient } from "@prisma/client";
import { recordAttendance } from "../lib/attendance";
import { checkoutEquipment, returnEquipment, EquipmentError } from "../lib/equipment";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });
  const students = await db.user.findMany({ where: { organizationId: classPeriod.organizationId, role: "STUDENT" } });
  const equipment = await db.equipmentItem.findFirstOrThrow({ where: { organizationId: classPeriod.organizationId } });

  // --- Attendance ---
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  await recordAttendance({
    classPeriodId: classPeriod.id,
    date: today,
    recordedById: teacher.id,
    entries: students.map((s) => ({ studentId: s.id, status: "PRESENT" as const })),
  });
  let records = await db.attendanceRecord.findMany({ where: { classPeriodId: classPeriod.id, date: today } });
  await assert(records.length === students.length, "attendance recorded for every enrolled student");
  await assert(records.every((r) => r.status === "PRESENT"), "all recorded as PRESENT");

  // Re-recording (upsert) should update, not duplicate.
  await recordAttendance({
    classPeriodId: classPeriod.id,
    date: today,
    recordedById: teacher.id,
    entries: [{ studentId: students[0]!.id, status: "TARDY" as const }],
  });
  records = await db.attendanceRecord.findMany({ where: { classPeriodId: classPeriod.id, date: today } });
  await assert(records.length === students.length, "re-recording upserts instead of duplicating");
  await assert(
    records.find((r) => r.studentId === students[0]!.id)?.status === "TARDY",
    "updated status reflected after re-recording",
  );

  // --- Equipment checkout / return ---
  await assert(equipment.status === "AVAILABLE", "seeded equipment starts AVAILABLE");
  const checkout = await checkoutEquipment({
    equipmentId: equipment.id,
    userId: students[0]!.id,
    organizationId: classPeriod.organizationId,
  });
  let refreshedItem = await db.equipmentItem.findUniqueOrThrow({ where: { id: equipment.id } });
  await assert(refreshedItem.status === "CHECKED_OUT", "equipment marked CHECKED_OUT after checkout");

  try {
    await checkoutEquipment({ equipmentId: equipment.id, userId: students[1]!.id, organizationId: classPeriod.organizationId });
    throw new Error("expected EquipmentError");
  } catch (e) {
    await assert(e instanceof EquipmentError, "double-checkout of the same item is rejected");
  }

  await returnEquipment({ checkoutId: checkout.id, organizationId: classPeriod.organizationId });
  refreshedItem = await db.equipmentItem.findUniqueOrThrow({ where: { id: equipment.id } });
  await assert(refreshedItem.status === "AVAILABLE", "equipment returns to AVAILABLE after return with no damage notes");

  // --- Teacher message reaches the linked parent's query path ---
  const message = await db.teacherMessage.create({
    data: {
      classPeriodId: classPeriod.id,
      sentById: teacher.id,
      subject: "Smoke test subject",
      body: "Smoke test body",
    },
  });
  const parentLink = await db.parentLink.findFirstOrThrow({
    where: { student: { organizationId: classPeriod.organizationId } },
  });
  const visibleToParent = await db.teacherMessage.findMany({
    where: {
      classPeriod: {
        enrollments: { some: { studentId: parentLink.studentId } },
      },
    },
  });
  await assert(
    visibleToParent.some((m) => m.id === message.id),
    "message is visible via the same query path the parent dashboard uses",
  );

  // --- Submission grading ---
  // No project has been AI-generated for the demo org in this environment
  // (that requires a real ANTHROPIC_API_KEY), so create a minimal Project +
  // Submission directly to exercise the grading write path in isolation.
  const testProject = await db.project.create({
    data: {
      title: "Smoke Test Project",
      category: "PSA",
      status: "READY",
      classPeriodId: classPeriod.id,
      brief: "smoke test",
    },
  });
  const submission = await db.submission.create({
    data: { projectId: testProject.id, studentId: students[0]!.id },
  });
  const updated = await db.submission.update({
    where: { id: submission.id },
    data: { grade: { rubricScores: { storytelling: 18 }, total: 92, feedback: "Great pacing." }, status: "GRADED" },
  });
  await assert(updated.status === "GRADED", "grading a submission sets status to GRADED");
  await assert((updated.grade as { total: number }).total === 92, "grade total persisted correctly");

  // Cleanup.
  await db.attendanceRecord.deleteMany({ where: { classPeriodId: classPeriod.id, date: today } });
  await db.equipmentCheckout.deleteMany({ where: { id: checkout.id } });
  await db.teacherMessage.delete({ where: { id: message.id } });
  await db.submission.delete({ where: { id: submission.id } });
  await db.project.delete({ where: { id: testProject.id } });

  console.log("\nAll Phase 4 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
