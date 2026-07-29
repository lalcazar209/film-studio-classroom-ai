import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createClassPeriod, ClassPeriodError } from "@/lib/class-periods";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  name: z.string().min(2).max(200),
  teacherId: z.string().cuid(),
  gradeLevel: z.string().min(1).max(20),
  period: z.string().max(20).optional(),
  pathway: z.string().max(200).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can list all class periods" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const classPeriods = await db.classPeriod.findMany({
    where: { organizationId: session.user.organizationId },
    include: { teacher: true, _count: { select: { enrollments: true, projects: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ classPeriods });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can create class periods" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const classPeriod = await createClassPeriod({
      organizationId: session.user.organizationId,
      ...parsed.data,
    });
    return NextResponse.json({ classPeriod }, { status: 201 });
  } catch (error) {
    if (error instanceof ClassPeriodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error("Class period creation failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
