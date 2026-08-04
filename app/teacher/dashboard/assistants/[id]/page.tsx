import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAssistant } from "@/lib/ai/assistants";
import { getAssistantHistory } from "@/lib/ai/assistant-chat-service";
import { AssistantChat } from "@/components/assistant-chat";
import { CinemaPage } from "@/components/ui/cinema-page";

export default async function TeacherAssistantChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/dashboard/assistants/${id}`);

  const assistant = getAssistant(id);
  if (!assistant) notFound();

  const history = await getAssistantHistory(session.user.id, id);

  return (
    <CinemaPage title={assistant.name} description={assistant.tagline}>
      <AssistantChat
        assistantId={id}
        assistantName={assistant.name}
        initialHistory={history.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
        theme="cinema"
      />
    </CinemaPage>
  );
}
