import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createClassPeriod,
  updateClassPeriod,
  deleteClassPeriod,
  enrollStudent,
  unenrollStudent,
  ClassPeriodError,
} from "@/lib/class-periods";

const db = new PrismaClient();
let orgId: string;
let teacherId: string;
let studentId: string;

beforeAll(async () => {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });
  const student = await db.user.findFirstOrThrow({ where: { organizationId: org.id, role: "STUDENT" } });
  orgId = org.id;
  teacherId = teacher.id;
  studentId = student.id;
});

afterAll(async () => {
  await db.$disconnect();
});

describe("class period CRUD", () => {
  it("creates a class period with the given fields", async () => {
    const classPeriod = await createClassPeriod({ organizationId: orgId, teacherId, name: "Vitest Class", gradeLevel: "11" });
    expect(classPeriod.name).toBe("Vitest Class");
    await db.classPeriod.delete({ where: { id: classPeriod.id } });
  });

  it("rejects creating a class period with a non-teacher as the teacher", async () => {
    await expect(
      createClassPeriod({ organizationId: orgId, teacherId: studentId, name: "x", gradeLevel: "9" }),
    ).rejects.toBeInstanceOf(ClassPeriodError);
  });

  it("updates a class period's name", async () => {
    const classPeriod = await createClassPeriod({ organizationId: orgId, teacherId, name: "Before", gradeLevel: "11" });
    const updated = await updateClassPeriod(classPeriod.id, orgId, { name: "After" });
    expect(updated.name).toBe("After");
    await db.classPeriod.delete({ where: { id: classPeriod.id } });
  });

  it("rejects deleting a class period with enrolled students, then allows it once the roster is empty", async () => {
    const classPeriod = await createClassPeriod({ organizationId: orgId, teacherId, name: "Guarded Delete", gradeLevel: "11" });
    await enrollStudent(classPeriod.id, orgId, studentId);

    await expect(deleteClassPeriod(classPeriod.id, orgId)).rejects.toBeInstanceOf(ClassPeriodError);

    await unenrollStudent(classPeriod.id, orgId, studentId);
    await expect(deleteClassPeriod(classPeriod.id, orgId)).resolves.toBeUndefined();

    const gone = await db.classPeriod.findUnique({ where: { id: classPeriod.id } });
    expect(gone).toBeNull();
  });

  it("enrollStudent is idempotent (upsert, not duplicate rows)", async () => {
    const classPeriod = await createClassPeriod({ organizationId: orgId, teacherId, name: "Idempotent", gradeLevel: "11" });
    await enrollStudent(classPeriod.id, orgId, studentId);
    await enrollStudent(classPeriod.id, orgId, studentId);

    const count = await db.enrollment.count({ where: { classPeriodId: classPeriod.id, studentId } });
    expect(count).toBe(1);

    await unenrollStudent(classPeriod.id, orgId, studentId);
    await deleteClassPeriod(classPeriod.id, orgId);
  });
});
