import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateProjectBundle } from "@/lib/ai/curriculum-service";
import { ProjectCategory } from "@prisma/client";

const requestSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.nativeEnum(ProjectCategory),
  brief: z.string().min(10).max(4000),
  classPeriodId: z.string().cuid(),
  targetStandardCodes: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can generate projects" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const classPeriod = await db.classPeriod.findUnique({
    where: { id: parsed.data.classPeriodId },
    select: { teacherId: true, gradeLevel: true },
  });
  if (!classPeriod) {
    return NextResponse.json({ error: "Class period not found" }, { status: 404 });
  }
  if (classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "You do not teach this class period" }, { status: 403 });
  }

  try {
    const { project } = await generateProjectBundle({
      title: parsed.data.title,
      category: parsed.data.category,
      brief: parsed.data.brief,
      classPeriodId: parsed.data.classPeriodId,
      gradeLevel: classPeriod.gradeLevel,
      requestedById: session.user.id,
      targetStandardCodes: parsed.data.targetStandardCodes,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Project generation failed", error);
    return NextResponse.json(
      { error: "Generation failed. The project was not created." },
      { status: 502 },
    );
  }
}
