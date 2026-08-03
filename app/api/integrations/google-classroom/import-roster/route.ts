import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGoogleClassroomCredentials } from "@/lib/integrations/get-connection";
import { GoogleClassroomAdapter } from "@/lib/integrations/google-classroom";
import { reconcileRosterIntoEnrollments, RosterSyncError } from "@/lib/roster-sync";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  courseId: z.string().min(1),
  classPeriodId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can import rosters" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const credentials = await getGoogleClassroomCredentials(session.user.organizationId);
  if (!credentials) {
    return NextResponse.json({ error: "Google Classroom is not connected yet" }, { status: 400 });
  }

  try {
    const section = await new GoogleClassroomAdapter().fetchCourseRoster(credentials, parsed.data.courseId);
    const result = await reconcileRosterIntoEnrollments(
      session.user.organizationId,
      parsed.data.classPeriodId,
      section,
    );

    await db.classPeriod.update({
      where: { id: parsed.data.classPeriodId },
      data: { googleClassroomCourseId: parsed.data.courseId },
    });

    return NextResponse.json({ courseName: section.name, ...result });
  } catch (error) {
    if (error instanceof RosterSyncError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error("Google Classroom roster import failed", error);
    return NextResponse.json({ error: "Could not import the roster" }, { status: 502 });
  }
}
