import { db } from "@/lib/db";

export class ClassPeriodError extends Error {}

export interface CreateClassPeriodInput {
  organizationId: string;
  teacherId: string;
  name: string;
  period?: string;
  gradeLevel: string;
  pathway?: string;
}

export async function createClassPeriod(input: CreateClassPeriodInput) {
  const teacher = await db.user.findFirst({
    where: { id: input.teacherId, organizationId: input.organizationId, role: "TEACHER" },
  });
  if (!teacher) {
    throw new ClassPeriodError("Selected teacher was not found in this organization");
  }

  return db.classPeriod.create({
    data: {
      organizationId: input.organizationId,
      teacherId: input.teacherId,
      name: input.name,
      period: input.period,
      gradeLevel: input.gradeLevel,
      pathway: input.pathway,
    },
  });
}

export interface UpdateClassPeriodInput {
  name?: string;
  period?: string;
  gradeLevel?: string;
  teacherId?: string;
}

export async function updateClassPeriod(classPeriodId: string, organizationId: string, updates: UpdateClassPeriodInput) {
  const classPeriod = await db.classPeriod.findFirst({ where: { id: classPeriodId, organizationId } });
  if (!classPeriod) {
    throw new ClassPeriodError("Class period not found in this organization");
  }

  if (updates.teacherId) {
    const teacher = await db.user.findFirst({
      where: { id: updates.teacherId, organizationId, role: "TEACHER" },
    });
    if (!teacher) {
      throw new ClassPeriodError("Selected teacher was not found in this organization");
    }
  }

  return db.classPeriod.update({ where: { id: classPeriodId }, data: updates });
}

export async function deleteClassPeriod(classPeriodId: string, organizationId: string) {
  const classPeriod = await db.classPeriod.findFirst({
    where: { id: classPeriodId, organizationId },
    include: { _count: { select: { enrollments: true, projects: true } } },
  });
  if (!classPeriod) {
    throw new ClassPeriodError("Class period not found in this organization");
  }
  if (classPeriod._count.enrollments > 0 || classPeriod._count.projects > 0) {
    throw new ClassPeriodError(
      "This class period has enrolled students or generated projects and can't be deleted — that history has to stay intact. Contact support if it genuinely needs to be removed.",
    );
  }

  await db.classPeriod.delete({ where: { id: classPeriodId } });
}

export async function enrollStudent(classPeriodId: string, organizationId: string, studentId: string) {
  const [classPeriod, student] = await Promise.all([
    db.classPeriod.findFirst({ where: { id: classPeriodId, organizationId } }),
    db.user.findFirst({ where: { id: studentId, organizationId, role: "STUDENT" } }),
  ]);
  if (!classPeriod) throw new ClassPeriodError("Class period not found in this organization");
  if (!student) throw new ClassPeriodError("Student not found in this organization");

  return db.enrollment.upsert({
    where: { studentId_classPeriodId: { studentId, classPeriodId } },
    update: {},
    create: { studentId, classPeriodId },
  });
}

export async function unenrollStudent(classPeriodId: string, organizationId: string, studentId: string) {
  const classPeriod = await db.classPeriod.findFirst({ where: { id: classPeriodId, organizationId } });
  if (!classPeriod) throw new ClassPeriodError("Class period not found in this organization");

  await db.enrollment.deleteMany({ where: { classPeriodId, studentId } });
}
