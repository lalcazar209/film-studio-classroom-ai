import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateProjectCoverImage } from "@/lib/ai/image-generation-service";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";
import { ImageProviderError } from "@/lib/ai/image-provider";
import { CloudinaryError } from "@/lib/integrations/cloudinary";
import { logger } from "@/lib/logger";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.project.findUnique({ where: { id }, include: { classPeriod: true } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const coverImageUrl = await generateProjectCoverImage({
      projectId: project.id,
      title: project.title,
      category: PROJECT_CATEGORY_LABELS[project.category],
      brief: project.brief,
    });

    await db.project.update({ where: { id }, data: { coverImageUrl } });

    return NextResponse.json({ coverImageUrl });
  } catch (error) {
    if (error instanceof ImageProviderError || error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    logger.error("Project cover image generation failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
