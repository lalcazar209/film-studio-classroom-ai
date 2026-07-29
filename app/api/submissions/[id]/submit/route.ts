import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitWork, SubmissionError } from "@/lib/submissions";

const requestSchema = z.object({
  videoUrl: z.string().url(),
  reflection: z.string().max(4000).optional(),
  selfAssess: z.object({ rating: z.number().min(1).max(5), notes: z.string().max(2000) }).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can submit work" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const submission = await submitWork({
      submissionId: id,
      studentId: session.user.id,
      videoUrl: parsed.data.videoUrl,
      reflection: parsed.data.reflection,
      selfAssess: parsed.data.selfAssess,
    });
    return NextResponse.json({ submission });
  } catch (error) {
    if (error instanceof SubmissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Submission failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
