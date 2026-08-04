import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePosterImage } from "@/lib/ai/image-generation-service";
import type { FilmStudioBundle } from "@/lib/ai/schemas";
import { ImageProviderError } from "@/lib/ai/image-provider";
import { CloudinaryError } from "@/lib/integrations/cloudinary";
import { logger } from "@/lib/logger";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Matches app/api/film-studio/generate/route.ts's access model: any
  // teacher/admin/mentor in the project's organization, not just its
  // creator — AI Film Studio projects are shared within an org already,
  // but students/parents still shouldn't be able to trigger generation.
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN" && session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await db.filmStudioProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const marketingPlan = project.marketingPlan as unknown as FilmStudioBundle["marketingPlan"];

  try {
    const posterImageUrl = await generatePosterImage({
      filmStudioProjectId: project.id,
      title: project.title,
      genre: project.genre,
      logline: project.logline,
      posterConcept: marketingPlan.posterConcept,
    });

    await db.filmStudioProject.update({ where: { id }, data: { posterImageUrl } });

    return NextResponse.json({ posterImageUrl });
  } catch (error) {
    if (error instanceof ImageProviderError || error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    logger.error("Poster image generation failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
