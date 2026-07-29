import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateVideoReview } from "@/lib/ai/video-review-service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can run AI video review" }, { status: 403 });
  }

  const submission = await db.submission.findUnique({
    where: { id },
    select: { project: { select: { classPeriod: { select: { teacherId: true } } } } },
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (submission.project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "You do not teach this class period" }, { status: 403 });
  }

  try {
    const review = await generateVideoReview(id);
    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    console.error("Video review failed", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
