import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const requestSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can configure integrations" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const connection = await db.integrationConnection.upsert({
    where: { organizationId_provider: { organizationId: session.user.organizationId, provider: "INFINITE_CAMPUS" } },
    update: { metadata: parsed.data },
    create: { organizationId: session.user.organizationId, provider: "INFINITE_CAMPUS", metadata: parsed.data },
  });

  return NextResponse.json({ connection: { ...connection, metadata: { baseUrl: parsed.data.baseUrl } } });
}
