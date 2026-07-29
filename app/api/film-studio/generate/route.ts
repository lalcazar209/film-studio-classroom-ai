import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateFilmStudioProject } from "@/lib/ai/film-studio-service";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  concept: z.string().min(10).max(2000),
  genre: z.string().min(2).max(100),
  castSize: z.number().int().positive().max(50).optional(),
  shootDays: z.number().int().positive().max(30).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN" && session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Only teachers, admins, and mentors can use AI Film Studio" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const project = await generateFilmStudioProject({
      ...parsed.data,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    logger.error("AI Film Studio generation failed", error);
    return NextResponse.json({ error: "Generation failed. Nothing was saved." }, { status: 502 });
  }
}
