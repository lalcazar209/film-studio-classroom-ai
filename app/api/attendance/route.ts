import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordAttendance, AttendanceError } from "@/lib/attendance";
import { AttendanceStatus } from "@prisma/client";

const requestSchema = z.object({
  classPeriodId: z.string().cuid(),
  date: z.string().date(),
  entries: z
    .array(
      z.object({
        studentId: z.string().cuid(),
        status: z.nativeEnum(AttendanceStatus),
        notes: z.string().max(500).optional(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can record attendance" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const classPeriod = await db.classPeriod.findUnique({
    where: { id: parsed.data.classPeriodId },
    select: { teacherId: true },
  });
  if (!classPeriod) {
    return NextResponse.json({ error: "Class period not found" }, { status: 404 });
  }
  if (classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "You do not teach this class period" }, { status: 403 });
  }

  try {
    await recordAttendance({
      classPeriodId: parsed.data.classPeriodId,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      recordedById: session.user.id,
      entries: parsed.data.entries,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AttendanceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Attendance recording failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
