import { db } from "@/lib/db";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function generateRosterCsv(organizationId: string): Promise<string> {
  const classPeriods = await db.classPeriod.findMany({
    where: { organizationId },
    include: {
      teacher: true,
      enrollments: { include: { student: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows: string[][] = [];
  for (const classPeriod of classPeriods) {
    for (const enrollment of classPeriod.enrollments) {
      rows.push([
        classPeriod.name,
        classPeriod.gradeLevel,
        classPeriod.teacher.name ?? classPeriod.teacher.email,
        enrollment.student.name ?? "",
        enrollment.student.email,
      ]);
    }
  }

  return toCsv(["Class Period", "Grade Level", "Teacher", "Student Name", "Student Email"], rows);
}

export async function generateStandardsCoverageCsv(organizationId: string): Promise<string> {
  const projectStandards = await db.projectStandard.findMany({
    where: { project: { classPeriod: { organizationId } } },
    include: { standard: true, project: { include: { classPeriod: true } } },
    orderBy: { standard: { code: "asc" } },
  });

  const rows = projectStandards.map((ps) => [
    ps.standard.framework,
    ps.standard.code,
    ps.standard.description,
    ps.project.title,
    ps.project.classPeriod.name,
  ]);

  return toCsv(["Framework", "Standard Code", "Description", "Project", "Class Period"], rows);
}
