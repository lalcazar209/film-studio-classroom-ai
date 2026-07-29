import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AssistantsDirectory } from "@/components/assistants-directory";

export default async function TeacherAssistantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/assistants");

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">AI Assistants</h1>
        <p className="text-studio-ink/60 dark:text-white/60">
          Nineteen role-specific experts, each scoped to their lane.
        </p>
      </div>
      <AssistantsDirectory basePath="/teacher/dashboard/assistants" />
    </main>
  );
}
