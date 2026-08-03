import { describe, expect, it, beforeAll, afterAll, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { reconcileRosterIntoEnrollments, RosterSyncError } from "@/lib/roster-sync";
import type { SisRosterSection } from "@/lib/integrations/sis-adapter";

const db = new PrismaClient();
let orgId: string;
let classPeriodId: string;
let teacherEmail: string;
const createdUserIds: string[] = [];

beforeAll(async () => {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });
  orgId = classPeriod.organizationId;
  classPeriodId = classPeriod.id;
  teacherEmail = teacher.email;
});

afterAll(async () => {
  await db.$disconnect();
});

afterEach(async () => {
  if (createdUserIds.length) {
    await db.enrollment.deleteMany({ where: { studentId: { in: createdUserIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

function section(overrides: Partial<SisRosterSection> = {}): SisRosterSection {
  return {
    sisSectionId: "course-1",
    name: "Intro to Film",
    teacherSisId: "teacher-1",
    students: [],
    ...overrides,
  };
}

describe("reconcileRosterIntoEnrollments", () => {
  it("creates a new student and enrolls them when the email doesn't exist yet", async () => {
    const email = `roster-new-${Date.now()}@example.com`;
    const result = await reconcileRosterIntoEnrollments(
      orgId,
      classPeriodId,
      section({ students: [{ sisStudentId: "s1", firstName: "Ada", lastName: "Lovelace", email, gradeLevel: "9" }] }),
    );

    expect(result).toEqual({ studentsCreated: 1, studentsMatched: 0, skipped: 0, enrolled: 1 });

    const created = await db.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(created.id);
    expect(created.role).toBe("STUDENT");
    expect(created.organizationId).toBe(orgId);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_classPeriodId: { studentId: created.id, classPeriodId } },
    });
    expect(enrollment).not.toBeNull();
  });

  it("matches an existing STUDENT by email instead of creating a duplicate", async () => {
    const email = `roster-existing-${Date.now()}@example.com`;
    const existing = await db.user.create({ data: { email, role: "STUDENT", organizationId: orgId } });
    createdUserIds.push(existing.id);

    const result = await reconcileRosterIntoEnrollments(
      orgId,
      classPeriodId,
      section({ students: [{ sisStudentId: "s2", firstName: "Grace", lastName: "Hopper", email, gradeLevel: "10" }] }),
    );

    expect(result).toEqual({ studentsCreated: 0, studentsMatched: 1, skipped: 0, enrolled: 1 });
  });

  it("is idempotent — importing the same roster twice doesn't duplicate the enrollment", async () => {
    const email = `roster-twice-${Date.now()}@example.com`;
    const roster = section({ students: [{ sisStudentId: "s3", firstName: "Katherine", lastName: "Johnson", email, gradeLevel: "11" }] });

    const first = await reconcileRosterIntoEnrollments(orgId, classPeriodId, roster);
    const created = await db.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(created.id);
    const second = await reconcileRosterIntoEnrollments(orgId, classPeriodId, roster);

    expect(first.studentsCreated).toBe(1);
    expect(second.studentsCreated).toBe(0);
    expect(second.studentsMatched).toBe(1);

    const enrollmentCount = await db.enrollment.count({ where: { studentId: created.id, classPeriodId } });
    expect(enrollmentCount).toBe(1);
  });

  it("skips a roster entry whose email belongs to a non-STUDENT user without touching their role", async () => {
    const result = await reconcileRosterIntoEnrollments(
      orgId,
      classPeriodId,
      section({ students: [{ sisStudentId: "s4", firstName: "The", lastName: "Teacher", email: teacherEmail, gradeLevel: "9" }] }),
    );

    expect(result).toEqual({ studentsCreated: 0, studentsMatched: 0, skipped: 1, enrolled: 0 });

    const teacher = await db.user.findUniqueOrThrow({ where: { email: teacherEmail } });
    expect(teacher.role).toBe("TEACHER");
  });

  it("skips a roster entry whose email belongs to a STUDENT in a different organization", async () => {
    const otherOrg = await db.organization.create({ data: { name: "Roster Sync Other Org" } });
    const email = `roster-other-org-${Date.now()}@example.com`;
    const outsider = await db.user.create({ data: { email, role: "STUDENT", organizationId: otherOrg.id } });

    const result = await reconcileRosterIntoEnrollments(
      orgId,
      classPeriodId,
      section({ students: [{ sisStudentId: "s5", firstName: "Outside", lastName: "Student", email, gradeLevel: "9" }] }),
    );

    expect(result).toEqual({ studentsCreated: 0, studentsMatched: 0, skipped: 1, enrolled: 0 });

    await db.user.delete({ where: { id: outsider.id } });
    await db.organization.delete({ where: { id: otherOrg.id } });
  });

  it("skips roster entries with no email", async () => {
    const result = await reconcileRosterIntoEnrollments(
      orgId,
      classPeriodId,
      section({ students: [{ sisStudentId: "s6", firstName: "No", lastName: "Email", email: null, gradeLevel: "9" }] }),
    );
    expect(result).toEqual({ studentsCreated: 0, studentsMatched: 0, skipped: 1, enrolled: 0 });
  });

  it("throws RosterSyncError for a class period outside the organization", async () => {
    const otherOrg = await db.organization.create({ data: { name: "Roster Sync Wrong Org" } });
    await expect(
      reconcileRosterIntoEnrollments(otherOrg.id, classPeriodId, section()),
    ).rejects.toBeInstanceOf(RosterSyncError);
    await db.organization.delete({ where: { id: otherOrg.id } });
  });
});
