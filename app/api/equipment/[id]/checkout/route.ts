import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { checkoutEquipment, EquipmentError } from "@/lib/equipment";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  userId: z.string().cuid(),
  dueAt: z.string().datetime().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only staff can check out equipment" }, { status: 403 });
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
    const checkout = await checkoutEquipment({
      equipmentId: id,
      userId: parsed.data.userId,
      organizationId: session.user.organizationId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    });
    return NextResponse.json({ checkout }, { status: 201 });
  } catch (error) {
    if (error instanceof EquipmentError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error("Equipment checkout failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
