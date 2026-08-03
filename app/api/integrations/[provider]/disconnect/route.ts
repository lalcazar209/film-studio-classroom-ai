import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { IntegrationProviderType } from "@prisma/client";

export async function POST(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage integrations" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  await db.integrationConnection.deleteMany({
    where: { organizationId: session.user.organizationId, provider: provider as IntegrationProviderType },
  });

  return NextResponse.json({ ok: true });
}
