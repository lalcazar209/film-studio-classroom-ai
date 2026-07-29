import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { changeUserRole, setUserActive, UserManagementError } from "@/lib/user-management";
import { Role } from "@prisma/client";

const requestSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
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
    let user = null;
    if (parsed.data.role) {
      user = await changeUserRole(session.user.organizationId, id, parsed.data.role, session.user.id);
    }
    if (parsed.data.isActive !== undefined) {
      user = await setUserActive(session.user.organizationId, id, parsed.data.isActive, session.user.id);
    }
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof UserManagementError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("User update failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
