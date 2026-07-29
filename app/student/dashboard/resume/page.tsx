import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResumeGenerator } from "@/components/resume-generator";
import type { ResumeContent } from "@/lib/ai/resume-service";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/resume");

  const existing = await db.portfolioItem.findFirst({
    where: { userId: session.user.id, type: "RESUME" },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-bold">Resume Builder</h1>
        <p className="text-black/60 dark:text-white/60">
          Generated from your completed projects. Regenerate any time you submit new work.
        </p>
      </div>

      <ResumeGenerator initialResume={existing ? (existing.metadata as unknown as ResumeContent) : null} />
    </main>
  );
}
