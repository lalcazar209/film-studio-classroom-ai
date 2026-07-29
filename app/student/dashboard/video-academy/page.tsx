import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
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
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Video Academy</h1>
      <p className="text-studio-ink/60 dark:text-white/60">
        Short tutorials from your teacher — techniques, workflows, and practice activities.
      </p>

      <Card>
        <CardContent className="pt-6">
          {tutorials.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">No tutorials available yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tutorials.map((tutorial) => (
                <li key={tutorial.id} className="flex items-center justify-between">
                  <Link
                    href={`/student/dashboard/video-academy/${tutorial.id}`}
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
