import { db } from "@/lib/db";
import type { SisRosterSection } from "@/lib/integrations/sis-adapter";

export class RosterSyncError extends Error {}

export interface RosterSyncResult {
  studentsCreated: number;
  studentsMatched: number;
  skipped: number;
  enrolled: number;
}

/**
 * Reconciles a roster pulled from any source in the shared
 * SisRosterSection shape (Infinite Campus, Google Classroom, ...) into
 * real Enrollment records for a class period — the piece that was
 * missing before: roster *preview* existed, but nothing turned it into
 * actual enrollment data.
 *
 * Deliberately conservative about existing accounts: a roster entry
 * whose email already belongs to a non-STUDENT user (a teacher, admin,
 * etc. — e.g. their own email surfacing on a course roster by mistake)
 * or to a STUDENT in a *different* organization is skipped rather than
 * silently reassigned, since either case is far more likely to be bad
 * data than an intentional role change.
 */
export async function reconcileRosterIntoEnrollments(
  organizationId: string,
  classPeriodId: string,
  section: SisRosterSection,
): Promise<RosterSyncResult> {
  const classPeriod = await db.classPeriod.findFirst({ where: { id: classPeriodId, organizationId } });
  if (!classPeriod) throw new RosterSyncError("Class period not found in this organization");

  const result: RosterSyncResult = { studentsCreated: 0, studentsMatched: 0, skipped: 0, enrolled: 0 };

  for (const rosterStudent of section.students) {
    if (!rosterStudent.email) {
      result.skipped++;
      continue;
    }

    const existing = await db.user.findUnique({ where: { email: rosterStudent.email } });
    let studentId: string;

    if (existing) {
      if (existing.organizationId && existing.organizationId !== organizationId) {
        result.skipped++;
        continue;
      }
      if (existing.role !== "STUDENT") {
        result.skipped++;
        continue;
      }
      if (!existing.organizationId) {
        await db.user.update({ where: { id: existing.id }, data: { organizationId } });
      }
      studentId = existing.id;
      result.studentsMatched++;
    } else {
      const name = `${rosterStudent.firstName} ${rosterStudent.lastName}`.trim();
      const created = await db.user.create({
        data: { email: rosterStudent.email, name: name || null, role: "STUDENT", organizationId },
      });
      studentId = created.id;
      result.studentsCreated++;
    }

    await db.enrollment.upsert({
      where: { studentId_classPeriodId: { studentId, classPeriodId } },
      update: {},
      create: { studentId, classPeriodId },
    });
    result.enrolled++;
  }

  return result;
}
