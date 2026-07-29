import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const requestSchema = z.object({
  grade: z.object({
    rubricScores: z.record(z.string(), z.number()),
    total: z.number(),
    feedback: z.string().max(4000).optional(),
  }),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submission = await db.submission.findUnique({
    where: { id },
    select: { project: { select: { classPeriod: { select: { teacherId: true } } } } },
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (submission.project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "You do not teach this class period" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.submission.update({
    where: { id },
    data: { grade: parsed.data.grade, status: "GRADED" },
  });

  return NextResponse.json({ submission: updated });
}
