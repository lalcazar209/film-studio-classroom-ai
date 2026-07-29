import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard");

  const classPeriods = await db.classPeriod.findMany({
    where: { teacherId: session.user.id },
    include: {
      projects: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-studio-accent">Welcome back</p>
          <h1 className="font-display text-3xl font-extrabold">Your Classes</h1>
        </div>
        <Link href="/teacher/dashboard/project-generator">
          <Button>+ Generate New Project</Button>
        </Link>
      </div>

      {classPeriods.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-black/60 dark:text-white/60">
            No class periods yet. Set one up to start generating projects.
          </CardContent>
        </Card>
      ) : (
        classPeriods.map((cp) => (
          <Card key={cp.id}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                {cp.name} · Grade {cp.gradeLevel} · {cp._count.enrollments} students
              </CardTitle>
              <div className="flex gap-2">
                <Link
                  href={`/teacher/dashboard/attendance/${cp.id}`}
                  className="text-xs text-studio-accent hover:underline"
                >
                  Attendance
                </Link>
                <Link
                  href={`/teacher/dashboard/gradebook/${cp.id}`}
                  className="text-xs text-studio-accent hover:underline"
                >
                  Gradebook
                </Link>
                <Link
                  href={`/teacher/dashboard/messages/${cp.id}`}
                  className="text-xs text-studio-accent hover:underline"
                >
                  Message Parents
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cp.projects.length === 0 ? (
                <p className="text-sm text-black/60 dark:text-white/60">No projects generated yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {cp.projects.map((project) => (
                    <li key={project.id} className="flex items-center justify-between">
                      <Link href={`/teacher/projects/${project.id}`} className="hover:text-studio-accent">
                        {project.title}
                      </Link>
                      <span className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                        {PROJECT_CATEGORY_LABELS[project.category]} · {project.status}
                        <Link href={`/teacher/projects/${project.id}/edit`} className="text-studio-accent hover:underline">
                          Edit
                        </Link>
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
