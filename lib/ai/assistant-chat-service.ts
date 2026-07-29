import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { getAssistant } from "./assistants";

const HISTORY_LIMIT = 20;

export class AssistantNotFoundError extends Error {}

export async function sendAssistantMessage(userId: string, assistantId: string, content: string) {
  const assistant = getAssistant(assistantId);
  if (!assistant) {
    throw new AssistantNotFoundError(`Unknown assistant "${assistantId}"`);
  }

  const history = await db.assistantMessage.findMany({
    where: { userId, assistantId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  await db.assistantMessage.create({ data: { userId, assistantId, role: "USER", content } });

  const provider = getAIProvider();
  const result = await provider.generate({
    messages: [
      { role: "system", content: assistant.systemPrompt },
      ...history
        .reverse()
        .map((m) => ({ role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant", content: m.content })),
      { role: "user", content },
    ],
    maxTokens: 512,
    temperature: 0.7,
  });

  return db.assistantMessage.create({
    data: { userId, assistantId, role: "ASSISTANT", content: result.text },
  });
}

export async function getAssistantHistory(userId: string, assistantId: string) {
  return db.assistantMessage.findMany({
    where: { userId, assistantId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}
