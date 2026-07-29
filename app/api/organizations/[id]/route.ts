import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const requestSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  district: z.string().max(200).optional(),
  cdsCode: z.string().max(20).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can edit school settings" }, { status: 403 });
  }
  if (session.user.organizationId !== id) {
    return NextResponse.json({ error: "You can only edit your own organization" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const organization = await db.organization.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ organization });
}
