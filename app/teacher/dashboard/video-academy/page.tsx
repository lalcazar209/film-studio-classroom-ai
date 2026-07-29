import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Video Academy</h1>
        <p className="text-studio-ink/60 dark:text-white/60">
          Generate instructional tutorials — narration, shot list, teacher script, practice
          activity, quiz, transcript, and captions — shared across your school.
        </p>
      </div>

      <TutorialGeneratorForm />

      <Card>
        <CardHeader>
          <CardTitle>Library</CardTitle>
        </CardHeader>
        <CardContent>
          {tutorials.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">No tutorials generated yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tutorials.map((tutorial) => (
                <li key={tutorial.id} className="flex items-center justify-between">
                  <Link
                    href={`/teacher/dashboard/video-academy/${tutorial.id}`}
                    className="hover:text-studio-accent"
                  >
                    {tutorial.title}
                  </Link>
                  <span className="text-xs text-studio-ink/50 dark:text-white/50">
                    {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
