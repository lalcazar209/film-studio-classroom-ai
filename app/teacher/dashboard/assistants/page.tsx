import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AssistantsDirectory } from "@/components/assistants-directory";
import { CinemaPage } from "@/components/ui/cinema-page";

export default async function TeacherAssistantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/assistants");

  return (
    <CinemaPage title="AI Assistants" description="Nineteen role-specific experts, each scoped to their lane.">
      <AssistantsDirectory basePath="/teacher/dashboard/assistants" theme="cinema" />
    </CinemaPage>
  );
}
