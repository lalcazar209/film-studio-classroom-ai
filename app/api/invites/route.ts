import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createInvite, InviteError } from "@/lib/invites";
import { Role } from "@prisma/client";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
  studentId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can send invites" }, { status: 403 });
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
    const invite = await createInvite({
      organizationId: session.user.organizationId,
      createdById: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error("Invite creation failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
