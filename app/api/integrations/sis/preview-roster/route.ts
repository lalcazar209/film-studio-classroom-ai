import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSisAdapter } from "@/lib/integrations/sis-registry";
import type { SisCredentials } from "@/lib/integrations/sis-adapter";
import { logger } from "@/lib/logger";

const requestSchema = z.object({ schoolSisId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can preview SIS rosters" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const connection = await db.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId: session.user.organizationId, provider: "INFINITE_CAMPUS" } },
  });
  if (!connection?.metadata) {
    return NextResponse.json({ error: "Infinite Campus is not configured yet" }, { status: 400 });
  }

  try {
    const adapter = getSisAdapter("INFINITE_CAMPUS");
    const sections = await adapter.fetchRoster(connection.metadata as unknown as SisCredentials, parsed.data.schoolSisId);
    return NextResponse.json({
      sectionCount: sections.length,
      studentCount: sections.reduce((sum, s) => sum + s.students.length, 0),
      sections: sections.map((s) => ({ name: s.name, studentCount: s.students.length })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    logger.error("SIS roster preview failed", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
