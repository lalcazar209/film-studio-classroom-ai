import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendAssistantMessage, getAssistantHistory, AssistantNotFoundError } from "@/lib/ai/assistant-chat-service";
import { getAssistant } from "@/lib/ai/assistants";

const requestSchema = z.object({ content: z.string().min(1).max(2000) });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!getAssistant(id)) {
    return NextResponse.json({ error: "Unknown assistant" }, { status: 404 });
  }

  const history = await getAssistantHistory(session.user.id, id);
  return NextResponse.json({ history });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const reply = await sendAssistantMessage(session.user.id, id, parsed.data.content);
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof AssistantNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Assistant message failed", error);
    return NextResponse.json({ error: "The assistant couldn't respond. Try again." }, { status: 502 });
  }
}
