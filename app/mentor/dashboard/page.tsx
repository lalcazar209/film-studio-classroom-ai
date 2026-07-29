import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";

export default async function MentorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/mentor/dashboard");

  const organizationProjects = session.user.organizationId
    ? await db.project.findMany({
        where: { classPeriod: { organizationId: session.user.organizationId }, status: "READY" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { classPeriod: true },
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Industry Mentor Portal</h1>
        <div className="flex gap-2">
          <Link href="/mentor/dashboard/film-studio">
            <Button variant="secondary">AI Film Studio</Button>
          </Link>
          <Link href="/mentor/dashboard/assistants">
            <Button variant="secondary">AI Assistants</Button>
          </Link>
        </div>
      </div>
      <p className="text-black/60 dark:text-white/60">
        Recent student work you can review and give industry feedback on.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {organizationProjects.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">Nothing to review yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {organizationProjects.map((project) => (
                <li key={project.id} className="flex justify-between">
                  <span>{project.title}</span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {PROJECT_CATEGORY_LABELS[project.category]} · {project.classPeriod.name}
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
