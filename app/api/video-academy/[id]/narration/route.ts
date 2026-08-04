import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTutorialNarration } from "@/lib/ai/video-narration-service";
import { TTSProviderError } from "@/lib/ai/tts-provider";
import { CloudinaryError } from "@/lib/integrations/cloudinary";
import { logger } from "@/lib/logger";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can generate narration audio" }, { status: 403 });
  }

  const tutorial = await db.tutorialVideo.findUnique({ where: { id } });
  if (!tutorial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (tutorial.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await generateTutorialNarration(id);
    return NextResponse.json({ tutorial: updated });
  } catch (error) {
    if (error instanceof TTSProviderError || error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    logger.error("Video Academy narration generation failed", error);
    return NextResponse.json({ error: "Narration generation failed." }, { status: 500 });
  }
}
