import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { saveDemoReel, DemoReelError, demoReelClipSchema } from "@/lib/demo-reel";

const requestSchema = z.object({
  title: z.string().min(1).max(200),
  clips: z.array(demoReelClipSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can build a demo reel" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const demoReel = await saveDemoReel(session.user.id, parsed.data.title, parsed.data.clips);
    return NextResponse.json({ demoReel });
  } catch (error) {
    if (error instanceof DemoReelError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Demo reel save failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
