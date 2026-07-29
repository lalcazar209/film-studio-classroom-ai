import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { IntegrationProviderType } from "@prisma/client";

const requestSchema = z.object({
  provider: z.enum([IntegrationProviderType.SLACK, IntegrationProviderType.ZAPIER]),
  webhookUrl: z.string().url(),
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
    where: { organizationId_provider: { organizationId: session.user.organizationId, provider: parsed.data.provider } },
    update: { metadata: { webhookUrl: parsed.data.webhookUrl } },
    create: {
      organizationId: session.user.organizationId,
      provider: parsed.data.provider,
      metadata: { webhookUrl: parsed.data.webhookUrl },
    },
  });

  return NextResponse.json({ connection });
}
