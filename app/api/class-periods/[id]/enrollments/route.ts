import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { enrollStudent, unenrollStudent, ClassPeriodError } from "@/lib/class-periods";

const requestSchema = z.object({ studentId: z.string().cuid() });

async function assertCanManage(classPeriodId: string, userId: string, role: string, organizationId: string | null) {
  if (!organizationId) return false;
  if (role === "ADMIN") return true;
  const classPeriod = await db.classPeriod.findUnique({ where: { id: classPeriodId }, select: { teacherId: true } });
  return classPeriod?.teacherId === userId;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertCanManage(id, session.user.id, session.user.role, session.user.organizationId))) {
    return NextResponse.json({ error: "You can't manage enrollment for this class period" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const enrollment = await enrollStudent(id, session.user.organizationId!, parsed.data.studentId);
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof ClassPeriodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Enrollment failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await assertCanManage(id, session.user.id, session.user.role, session.user.organizationId))) {
    return NextResponse.json({ error: "You can't manage enrollment for this class period" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await unenrollStudent(id, session.user.organizationId!, parsed.data.studentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ClassPeriodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Unenrollment failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
