import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleClassroomAdapter } from "@/lib/integrations/google-classroom";
import { getGoogleClassroomCredentials } from "@/lib/integrations/get-connection";
import { logger } from "@/lib/logger";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.project.findUnique({
    where: { id },
    include: { classPeriod: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }
  if (!project.classPeriod.googleClassroomCourseId) {
    return NextResponse.json(
      {
        error:
          "This class period isn't connected to a Google Classroom course yet. Import its roster from Admin → Class Periods first.",
      },
      { status: 400 },
    );
  }

  const credentials = await getGoogleClassroomCredentials(session.user.organizationId);
  if (!credentials) {
    return NextResponse.json(
      { error: "Connect Google Classroom first from Admin → Integrations" },
      { status: 400 },
    );
  }

  try {
    const { url } = await new GoogleClassroomAdapter().createAssignment(
      credentials,
      project.classPeriod.googleClassroomCourseId,
      {
        title: project.title,
        description: project.brief,
        maxPoints: 100,
      },
    );

    await db.project.update({ where: { id }, data: { classroomUrl: url } });

    return NextResponse.json({ classroomUrl: url });
  } catch (error) {
    logger.error("Google Classroom assignment push failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 502 });
  }
}
