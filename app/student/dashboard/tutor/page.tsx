import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTutorHistory } from "@/lib/ai/tutor-service";
import { TutorChat } from "@/components/tutor-chat";

export default async function TutorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/tutor");

  const history = await getTutorHistory(session.user.id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">AI Tutor</h1>
      <TutorChat
        initialHistory={history.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
      />
    </main>
  );
}
