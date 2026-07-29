import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateTutorialVideo } from "@/lib/ai/video-academy-service";
import { TutorialCategory } from "@prisma/client";

const requestSchema = z.object({
  topic: z.string().min(3).max(200),
  category: z.nativeEnum(TutorialCategory),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can generate Video Academy content" }, { status: 403 });
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
    const tutorial = await generateTutorialVideo({
      topic: parsed.data.topic,
      category: parsed.data.category,
      notes: parsed.data.notes,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    });
    return NextResponse.json({ tutorial }, { status: 201 });
  } catch (error) {
    console.error("Video Academy generation failed", error);
    return NextResponse.json({ error: "Generation failed. Nothing was saved." }, { status: 502 });
  }
}
