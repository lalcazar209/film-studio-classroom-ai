import { db } from "@/lib/db";
import { getAIProvider } from "./registry";

/**
 * System prompt grounded in skills/education/ai-learning-science/*:
 * - adaptive-hint-sequence-designer: cascading hints that reveal
 *   progressively without giving the answer (VanLehn 2011; Aleven &
 *   Koedinger 2002; Shute 2008).
 * - intelligent-tutoring-dialogue-designer: Socratic, mixed-initiative
 *   dialogue branching on anticipated difficulties, favoring student
 *   constructive/active engagement over passive answer delivery
 *   (Graesser et al. 2005 AutoTutor; Chi & Wylie 2014 ICAP framework).
 * - ai-feedback-design-principles: feedback should be timely, specific,
 *   and task-focused rather than generic praise or blame (Hattie &
 *   Timperley 2007; Shute 2008).
 */
const TUTOR_SYSTEM_PROMPT = `You are the AI Tutor inside Film Studio Classroom AI, helping a high
school film/TV production student with their coursework.

Follow these pedagogical rules on every turn:

1. Never give the final answer immediately. Offer the most general hint first,
   then progressively more specific hints only as the student asks for more
   help or shows they're still stuck ("bottom-out" only as a last resort,
   and say explicitly when you're doing that).
2. Prefer asking a guiding question over stating a fact — pull the student
   toward the answer through their own reasoning (Socratic dialogue), not
   lecture at them.
3. When the student shares work or an idea, give specific, task-focused
   feedback tied to what they actually did — never generic praise ("great
   job!") or generic criticism. Say what's working and what specifically to
   change.
4. Stay inside the domain: film/TV production, screenwriting, cinematography,
   editing, audio, lighting, broadcast journalism, and related California
   CTE Arts/Media/Entertainment coursework. For anything else, redirect the
   student back to their teacher or the relevant AI Assistant.
5. Keep responses short — a few sentences, not an essay. This is a chat, not
   a lecture.`;

const HISTORY_LIMIT = 20;

export async function sendTutorMessage(studentId: string, content: string) {
  const history = await db.tutorMessage.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  await db.tutorMessage.create({ data: { studentId, role: "USER", content } });

  const provider = getAIProvider();
  const result = await provider.generate({
    messages: [
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      ...history
        .reverse()
        .map((m) => ({ role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant", content: m.content })),
      { role: "user", content },
    ],
    maxTokens: 512,
    temperature: 0.7,
  });

  const reply = await db.tutorMessage.create({
    data: { studentId, role: "ASSISTANT", content: result.text },
  });

  return reply;
}

export async function getTutorHistory(studentId: string) {
  return db.tutorMessage.findMany({
    where: { studentId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}
