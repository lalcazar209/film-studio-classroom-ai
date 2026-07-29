import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateResume } from "@/lib/ai/resume-service";
import { logger } from "@/lib/logger";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can generate a resume" }, { status: 403 });
  }

  try {
    const resume = await generateResume(session.user.id);
    return NextResponse.json({ resume });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    logger.error("Resume generation failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
