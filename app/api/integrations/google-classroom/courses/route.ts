import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleClassroomCredentials } from "@/lib/integrations/get-connection";
import { GoogleClassroomAdapter } from "@/lib/integrations/google-classroom";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can browse Classroom courses" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const credentials = await getGoogleClassroomCredentials(session.user.organizationId);
  if (!credentials) {
    return NextResponse.json({ error: "Google Classroom is not connected yet" }, { status: 400 });
  }

  try {
    const courses = await new GoogleClassroomAdapter().listCourses(credentials);
    return NextResponse.json({ courses });
  } catch (error) {
    logger.error("Failed to list Google Classroom courses", error);
    return NextResponse.json({ error: "Could not reach Google Classroom" }, { status: 502 });
  }
}
