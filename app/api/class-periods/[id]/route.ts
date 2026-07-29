import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateClassPeriod, deleteClassPeriod, ClassPeriodError } from "@/lib/class-periods";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  period: z.string().max(20).optional(),
  gradeLevel: z.string().min(1).max(20).optional(),
  teacherId: z.string().cuid().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can edit class periods" }, { status: 403 });
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
    const classPeriod = await updateClassPeriod(id, session.user.organizationId, parsed.data);
    return NextResponse.json({ classPeriod });
  } catch (error) {
    if (error instanceof ClassPeriodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error("Class period update failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete class periods" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  try {
    await deleteClassPeriod(id, session.user.organizationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ClassPeriodError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error("Class period deletion failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
