import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateSkillsUsaPractice } from "@/lib/ai/skillsusa-service";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  contestName: z.string().min(3).max(200),
  studentLevel: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can generate SkillsUSA practice" }, { status: 403 });
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
    const practice = await generateSkillsUsaPractice({
      ...parsed.data,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    });
    return NextResponse.json({ practice }, { status: 201 });
  } catch (error) {
    logger.error("SkillsUSA practice generation failed", error);
    return NextResponse.json({ error: "Generation failed. Nothing was saved." }, { status: 502 });
  }
}
