import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { generateRosterCsv, generateStandardsCoverageCsv } from "@/lib/reports";

const db = new PrismaClient();
let orgId: string;

beforeAll(async () => {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  orgId = org.id;
});

afterAll(async () => {
  await db.$disconnect();
});

describe("generateRosterCsv", () => {
  it("has the expected header row", async () => {
    const csv = await generateRosterCsv(orgId);
    expect(csv.split("\n")[0]).toBe("Class Period,Grade Level,Teacher,Student Name,Student Email");
  });

  it("includes at least one row for the seeded org's enrolled students", async () => {
    const csv = await generateRosterCsv(orgId);
    const rows = csv.split("\n");
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[1]).toContain("@demo.filmstudioclassroom.ai");
  });

  it("quotes fields containing commas per CSV escaping rules", async () => {
    const org = await db.organization.create({ data: { name: "Comma, Testing Org" } });
    const teacher = await db.user.create({ data: { email: `csv-teacher-${Date.now()}@example.com`, role: "TEACHER", organizationId: org.id } });
    const student = await db.user.create({ data: { email: `csv-student-${Date.now()}@example.com`, name: "Last, First", role: "STUDENT", organizationId: org.id } });
    const classPeriod = await db.classPeriod.create({ data: { name: "CSV Test", gradeLevel: "9", organizationId: org.id, teacherId: teacher.id } });
    await db.enrollment.create({ data: { studentId: student.id, classPeriodId: classPeriod.id } });

    const csv = await generateRosterCsv(org.id);
    expect(csv).toContain('"Last, First"');

    await db.enrollment.deleteMany({ where: { classPeriodId: classPeriod.id } });
    await db.classPeriod.delete({ where: { id: classPeriod.id } });
    await db.user.deleteMany({ where: { id: { in: [teacher.id, student.id] } } });
    await db.organization.delete({ where: { id: org.id } });
  });
});

describe("generateStandardsCoverageCsv", () => {
  it("has the expected header row", async () => {
    const csv = await generateStandardsCoverageCsv(orgId);
    expect(csv.split("\n")[0]).toBe("Framework,Standard Code,Description,Project,Class Period");
  });
});
