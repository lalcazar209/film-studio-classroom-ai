import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAssistant } from "@/lib/ai/assistants";
import { getAssistantHistory } from "@/lib/ai/assistant-chat-service";
import { AssistantChat } from "@/components/assistant-chat";

export default async function MentorAssistantChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/mentor/dashboard/assistants/${id}`);

  const assistant = getAssistant(id);
  if (!assistant) notFound();

  const history = await getAssistantHistory(session.user.id, id);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{assistant.name}</h1>
        <p className="text-studio-ink/60 dark:text-white/60">{assistant.tagline}</p>
      </div>
      <AssistantChat
        assistantId={id}
        assistantName={assistant.name}
        initialHistory={history.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
      />
    </main>
  );
}
