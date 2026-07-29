import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { returnEquipment, EquipmentError } from "@/lib/equipment";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  damageNotes: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only staff can process equipment returns" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const checkout = await returnEquipment({
      checkoutId,
      organizationId: session.user.organizationId,
      damageNotes: parsed.data.damageNotes,
    });
    return NextResponse.json({ checkout });
  } catch (error) {
    if (error instanceof EquipmentError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error("Equipment return failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
