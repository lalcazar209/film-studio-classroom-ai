import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DemoReelBuilder } from "@/components/demo-reel-builder";
import { CinemaPage } from "@/components/ui/cinema-page";
import type { DemoReelClip } from "@/lib/demo-reel";

export default async function DemoReelPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/demo-reel");

  const [submissions, existing] = await Promise.all([
    db.submission.findMany({
      where: { studentId: session.user.id, videoUrl: { not: null } },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.portfolioItem.findFirst({ where: { userId: session.user.id, type: "DEMO_REEL" } }),
  ]);

  const existingMetadata = existing?.metadata as { clips?: DemoReelClip[] } | null;
  const existingClips = existingMetadata?.clips ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <CinemaPage
        eyebrow="Student Portal"
        title="Demo Reel Builder"
        description="Pick your best submitted clips to showcase together."
      >
        <DemoReelBuilder
          availableClips={submissions
            .filter((s) => s.videoUrl)
            .map((s) => ({ submissionId: s.id, title: s.project.title, videoUrl: s.videoUrl! }))}
          initialTitle={existing?.title ?? "My Demo Reel"}
          initialSelectedIds={existingClips.map((c) => c.submissionId)}
        />
      </CinemaPage>
    </main>
  );
}
