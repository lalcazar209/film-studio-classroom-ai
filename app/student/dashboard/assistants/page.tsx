import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AssistantsDirectory } from "@/components/assistants-directory";
import { CinemaPage } from "@/components/ui/cinema-page";

export default async function StudentAssistantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/assistants");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CinemaPage
        eyebrow="Student Portal"
        title="AI Assistants"
        description="Nineteen role-specific experts, each scoped to their lane."
      >
        <AssistantsDirectory basePath="/student/dashboard/assistants" theme="cinema" />
      </CinemaPage>
    </main>
  );
}
