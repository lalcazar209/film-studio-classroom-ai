import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResumeGenerator } from "@/components/resume-generator";
import { CinemaPage } from "@/components/ui/cinema-page";
import type { ResumeContent } from "@/lib/ai/resume-service";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/resume");

  const existing = await db.portfolioItem.findFirst({
    where: { userId: session.user.id, type: "RESUME" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <CinemaPage
        eyebrow="Student Portal"
        title="Resume Builder"
        description="Generated from your completed projects. Regenerate any time you submit new work."
      >
        <ResumeGenerator initialResume={existing ? (existing.metadata as unknown as ResumeContent) : null} />
      </CinemaPage>
    </main>
  );
}
