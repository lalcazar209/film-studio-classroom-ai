import { db } from "@/lib/db";
import type { AttendanceStatus } from "@prisma/client";

export class AttendanceError extends Error {}

export interface RecordAttendanceInput {
  classPeriodId: string;
  date: Date;
  recordedById: string;
  entries: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>;
}

/** Bulk upsert for one class period's roll for one day — the natural unit
 * of a "take attendance" action, not one row at a time. */
export async function recordAttendance(input: RecordAttendanceInput) {
  const roster = await db.enrollment.findMany({
    where: { classPeriodId: input.classPeriodId },
    select: { studentId: true },
  });
  const rosterIds = new Set(roster.map((r) => r.studentId));

  const invalid = input.entries.filter((e) => !rosterIds.has(e.studentId));
  if (invalid.length) {
    throw new AttendanceError("One or more students are not enrolled in this class period");
  }

  return db.$transaction(
    input.entries.map((entry) =>
      db.attendanceRecord.upsert({
        where: {
          classPeriodId_studentId_date: {
            classPeriodId: input.classPeriodId,
            studentId: entry.studentId,
            date: input.date,
          },
        },
        update: { status: entry.status, notes: entry.notes, recordedById: input.recordedById },
        create: {
          classPeriodId: input.classPeriodId,
          studentId: entry.studentId,
          date: input.date,
          status: entry.status,
          notes: entry.notes,
          recordedById: input.recordedById,
        },
      }),
    ),
  );
}
