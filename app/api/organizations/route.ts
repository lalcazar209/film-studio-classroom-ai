import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOrganization, OrganizationError } from "@/lib/organizations";

const requestSchema = z.object({
  name: z.string().min(2).max(200),
  district: z.string().max(200).optional(),
  cdsCode: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const organization = await createOrganization({
      creatorUserId: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Organization creation failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
