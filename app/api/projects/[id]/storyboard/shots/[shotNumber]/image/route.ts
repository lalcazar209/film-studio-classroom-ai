import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStoryboardShotImage } from "@/lib/ai/image-generation-service";
import type { ProjectBundle } from "@/lib/ai/schemas";
import { ImageProviderError } from "@/lib/ai/image-provider";
import { CloudinaryError } from "@/lib/integrations/cloudinary";
import { logger } from "@/lib/logger";

type StoryboardShot = ProjectBundle["storyboard"]["shots"][number] & { imageUrl?: string };

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; shotNumber: string }> },
) {
  const { id, shotNumber } = await params;
  const shotNum = Number(shotNumber);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.project.findUnique({
    where: { id },
    include: { classPeriod: true, storyboard: true },
  });
  if (!project || !project.storyboard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shots = project.storyboard.shots as unknown as StoryboardShot[];
  const shot = shots.find((s) => s.number === shotNum);
  if (!shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  }

  const visualTheme = project.storyboard.visualTheme as unknown as ProjectBundle["storyboard"]["visualTheme"];

  try {
    const imageUrl = await generateStoryboardShotImage({
      projectId: project.id,
      shotNumber: shot.number,
      description: shot.description,
      shotType: shot.shotType,
      movement: shot.movement,
      lighting: shot.lighting,
      visualTheme,
    });

    const updatedShots = shots.map((s) => (s.number === shotNum ? { ...s, imageUrl } : s));
    await db.storyboard.update({ where: { id: project.storyboard.id }, data: { shots: updatedShots } });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof ImageProviderError || error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    logger.error("Storyboard shot image generation failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
