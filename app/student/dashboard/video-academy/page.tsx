import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent } from "@/components/ui/cinema-card";
import { TUTORIAL_CATEGORY_LABELS } from "@/lib/constants/tutorial-categories";

export default async function StudentVideoAcademyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/video-academy");
  if (!session.user.organizationId) redirect("/onboarding");

  const tutorials = await db.tutorialVideo.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CinemaPage
        eyebrow="Student Portal"
        title="Video Academy"
        description="Short tutorials from your teacher — techniques, workflows, and practice activities."
      >
        <CinemaCard>
          <CinemaCardContent className="pt-6">
            {tutorials.length === 0 ? (
              <p className="text-sm text-cinema-muted">No tutorials available yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tutorials.map((tutorial) => (
                  <li key={tutorial.id} className="flex items-center justify-between">
                    <Link
                      href={`/student/dashboard/video-academy/${tutorial.id}`}
                      className="text-cinema-white/90 hover:text-cinema-red"
                    >
                      {tutorial.title}
                    </Link>
                    <span className="text-xs text-cinema-muted">
                      {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CinemaCardContent>
        </CinemaCard>
      </CinemaPage>
    </main>
  );
}
