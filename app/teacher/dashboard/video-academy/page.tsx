import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
import { TutorialGeneratorForm } from "@/components/tutorial-generator-form";
import { TUTORIAL_CATEGORY_LABELS } from "@/lib/constants/tutorial-categories";

export default async function VideoAcademyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/video-academy");
  if (!session.user.organizationId) redirect("/onboarding");

  const tutorials = await db.tutorialVideo.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CinemaPage
      title="Video Academy"
      description="Generate instructional tutorials — narration, shot list, teacher script, practice activity, quiz, transcript, and captions — shared across your school."
    >
      <div className="space-y-6">
        <TutorialGeneratorForm />

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Library</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            {tutorials.length === 0 ? (
              <p className="text-sm text-cinema-muted">No tutorials generated yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tutorials.map((tutorial) => (
                  <li key={tutorial.id} className="flex items-center justify-between">
                    <Link href={`/teacher/dashboard/video-academy/${tutorial.id}`} className="text-cinema-white hover:text-cinema-red">
                      {tutorial.title}
                    </Link>
                    <span className="text-xs text-cinema-muted">{TUTORIAL_CATEGORY_LABELS[tutorial.category]}</span>
                  </li>
                ))}
              </ul>
            )}
          </CinemaCardContent>
        </CinemaCard>
      </div>
    </CinemaPage>
  );
}
