import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard");

  const enrollments = await db.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      classPeriod: {
        include: { projects: { orderBy: { createdAt: "desc" }, take: 5 } },
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">My Projects</h1>
        <div className="flex gap-2">
          <Link href="/student/dashboard/portfolio">
            <Button variant="secondary">Portfolio</Button>
          </Link>
          <Link href="/student/dashboard/resume">
            <Button variant="secondary">Resume</Button>
          </Link>
          <Link href="/student/dashboard/demo-reel">
            <Button variant="secondary">Demo Reel</Button>
          </Link>
          <Link href="/student/dashboard/video-academy">
            <Button variant="secondary">Video Academy</Button>
          </Link>
          <Link href="/student/dashboard/tutor">
            <Button>AI Tutor</Button>
          </Link>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-black/60 dark:text-white/60">
            You&apos;re not enrolled in a class period yet. Ask your teacher to add you.
          </CardContent>
        </Card>
      ) : (
        enrollments.map(({ classPeriod }) => (
          <Card key={classPeriod.id}>
            <CardHeader>
              <CardTitle>{classPeriod.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {classPeriod.projects.length === 0 ? (
                <p className="text-sm text-black/60 dark:text-white/60">
                  No projects assigned yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {classPeriod.projects.map((project) => (
                    <li key={project.id} className="flex items-center justify-between">
                      <Link href={`/student/projects/${project.id}`} className="hover:text-studio-accent">
                        {project.title}
                      </Link>
                      <span className="text-xs text-black/50 dark:text-white/50">
                        {PROJECT_CATEGORY_LABELS[project.category]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
