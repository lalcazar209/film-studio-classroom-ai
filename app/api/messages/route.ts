import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const requestSchema = z.object({
  classPeriodId: z.string().cuid(),
  subject: z.string().min(2).max(200),
  body: z.string().min(2).max(5000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can message parents" }, { status: 403 });
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

  const message = await db.teacherMessage.create({
    data: {
      classPeriodId: parsed.data.classPeriodId,
      sentById: session.user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
