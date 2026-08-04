import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTutorHistory } from "@/lib/ai/tutor-service";
import { TutorChat } from "@/components/tutor-chat";
import { CinemaPage } from "@/components/ui/cinema-page";

export default async function TutorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/tutor");

  const history = await getTutorHistory(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <CinemaPage eyebrow="Student Portal" title="AI Tutor">
        <TutorChat initialHistory={history.map((m) => ({ id: m.id, role: m.role, content: m.content }))} />
      </CinemaPage>
    </main>
  );
}
