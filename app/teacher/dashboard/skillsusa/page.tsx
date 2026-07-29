import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillsUsaGeneratorForm } from "@/components/skillsusa-generator-form";

export default async function TeacherSkillsUsaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/skillsusa");
  if (!session.user.organizationId) redirect("/onboarding");

  const practices = await db.skillsUsaPractice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">SkillsUSA Mode</h1>
        <p className="text-studio-ink/60 dark:text-white/60">
          Competition practice packages: timed challenges, rubrics, judge sheets, mock competition
          schedules, and extra practice scenarios.
        </p>
      </div>

      <SkillsUsaGeneratorForm />

      <Card>
        <CardHeader>
          <CardTitle>Library</CardTitle>
        </CardHeader>
        <CardContent>
          {practices.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">No practice packages generated yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {practices.map((practice) => (
                <li key={practice.id} className="flex items-center justify-between">
                  <Link href={`/teacher/dashboard/skillsusa/${practice.id}`} className="hover:text-studio-accent">
                    {practice.contestName}
                  </Link>
                  <span className="text-xs text-studio-ink/50 dark:text-white/50">
                    {practice.createdAt.toLocaleDateString()}
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
