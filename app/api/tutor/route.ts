import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendTutorMessage, getTutorHistory } from "@/lib/ai/tutor-service";

const requestSchema = z.object({ content: z.string().min(1).max(2000) });

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const history = await getTutorHistory(session.user.id);
  return NextResponse.json({ history });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "The AI Tutor is for students" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const reply = await sendTutorMessage(session.user.id, parsed.data.content);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Tutor message failed", error);
    return NextResponse.json({ error: "The tutor couldn't respond. Try again." }, { status: 502 });
  }
}
