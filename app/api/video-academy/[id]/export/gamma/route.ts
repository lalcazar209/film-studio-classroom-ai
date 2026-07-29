import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateGammaAndWait, buildTutorialOutline, GammaError } from "@/lib/export/gamma";
import type { TutorialSegment } from "@/lib/ai/schemas";
import { logger } from "@/lib/logger";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tutorial = await db.tutorialVideo.findUnique({ where: { id } });
  if (!tutorial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (tutorial.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const gammaUrl = await generateGammaAndWait({
      title: tutorial.title,
      outline: buildTutorialOutline({
        learningObjective: tutorial.learningObjective,
        segments: tutorial.segments as unknown as TutorialSegment[],
      }),
    });

    await db.tutorialVideo.update({ where: { id }, data: { gammaUrl } });

    return NextResponse.json({ gammaUrl });
  } catch (error) {
    if (error instanceof GammaError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    logger.error("Gamma export failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
