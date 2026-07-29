import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { differentiationSchema, rubricSchema, quizSchema } from "@/lib/ai/schemas";

/**
 * Hand-editing for AI-generated content. Generation gets a teacher most of
 * the way there, but the platform must never force them to live with
 * whatever the model produced — every field editable here is a field a
 * teacher can override.
 */
const requestSchema = z.object({
  lessons: z
    .array(
      z.object({
        id: z.string().cuid(),
        objective: z.string().min(1).optional(),
        iCanStatement: z.string().min(1).optional(),
        differentiation: differentiationSchema.optional(),
      }),
    )
    .optional(),
  rubric: z.object({ title: z.string().min(1), criteria: rubricSchema.shape.criteria }).optional(),
  quiz: z.object({ title: z.string().min(1), questions: quizSchema.shape.questions }).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.project.findUnique({
    where: { id },
    select: { classPeriod: { select: { teacherId: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "You do not teach this class period" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    for (const lesson of parsed.data.lessons ?? []) {
      const { id: lessonId, ...updates } = lesson;
      if (Object.keys(updates).length === 0) continue;
      await tx.lesson.update({
        where: { id: lessonId, projectId: id },
        data: updates,
      });
    }

    if (parsed.data.rubric) {
      await tx.rubric.update({ where: { projectId: id }, data: parsed.data.rubric });
    }

    if (parsed.data.quiz) {
      await tx.quiz.update({ where: { projectId: id }, data: parsed.data.quiz });
    }
  });

  const updated = await db.project.findUniqueOrThrow({
    where: { id },
    include: { lessons: true, rubric: true, quiz: true },
  });

  return NextResponse.json({ project: updated });
}
