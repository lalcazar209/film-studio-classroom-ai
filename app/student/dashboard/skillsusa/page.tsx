import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export default async function StudentSkillsUsaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/skillsusa");
  if (!session.user.organizationId) redirect("/onboarding");

  const practices = await db.skillsUsaPractice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">SkillsUSA Mode</h1>
      <p className="text-black/60 dark:text-white/60">
        Practice for your competition: timed challenges, rubrics, and extra scenarios.
      </p>

      <Card>
        <CardContent className="pt-6">
          {practices.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">No practice packages available yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {practices.map((practice) => (
                <li key={practice.id} className="flex items-center justify-between">
                  <Link href={`/student/dashboard/skillsusa/${practice.id}`} className="hover:text-studio-accent">
                    {practice.contestName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
