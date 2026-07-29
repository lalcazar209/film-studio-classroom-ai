import type {
  SisAdapter,
  SisCredentials,
  SisGradePassback,
  SisRosterSection,
} from "./sis-adapter";

/**
 * Infinite Campus. Unlike the OAuth "connect your account" apps above,
 * Campus API access is provisioned directly by the district's IT/data
 * team per school — there's no self-serve developer console. A district
 * admin generates an API key/secret pair in Campus and gives it to the
 * school; we store it (baseUrl + apiKey + apiSecret) per Organization in
 * IntegrationConnection.metadata rather than running an OAuth redirect.
 *
 * Campus's REST API is authenticated via HTTP Basic auth using that
 * key/secret pair, scoped to the endpoints the district has granted.
 * Exact endpoint paths vary by Campus version/district configuration —
 * confirm the roster and gradebook endpoint paths against your district's
 * Campus API documentation before deploying; the shapes below reflect
 * Campus's general roster/gradebook resource model.
 */
export class InfiniteCampusAdapter implements SisAdapter {
  readonly provider = "INFINITE_CAMPUS" as const;

  async fetchRoster(credentials: SisCredentials, schoolSisId: string): Promise<SisRosterSection[]> {
    const response = await fetch(`${credentials.baseUrl}/campus/api/v1/schools/${schoolSisId}/sections`, {
      headers: { Authorization: this.basicAuthHeader(credentials) },
    });

    if (!response.ok) {
      throw new Error(`Infinite Campus roster fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as Array<{
      sectionId: string;
      sectionName: string;
      teacherId: string;
      students: Array<{ studentId: string; firstName: string; lastName: string; email: string | null; grade: string }>;
    }>;

    return data.map((section) => ({
      sisSectionId: section.sectionId,
      name: section.sectionName,
      teacherSisId: section.teacherId,
      students: section.students.map((student) => ({
        sisStudentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        gradeLevel: student.grade,
      })),
    }));
  }

  async pushGrade(credentials: SisCredentials, grade: SisGradePassback): Promise<void> {
    const response = await fetch(
      `${credentials.baseUrl}/campus/api/v1/sections/${grade.sisSectionId}/students/${grade.sisStudentId}/grades`,
      {
        method: "POST",
        headers: {
          Authorization: this.basicAuthHeader(credentials),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentName: grade.assignmentName,
          score: grade.pointsEarned,
          maxScore: grade.pointsPossible,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Infinite Campus grade passback failed: ${response.status}`);
    }
  }

  private basicAuthHeader(credentials: SisCredentials): string {
    return `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64")}`;
  }
}
