import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilmStudioGeneratorForm } from "@/components/film-studio-generator-form";

export default async function TeacherFilmStudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/film-studio");
  if (!session.user.organizationId) redirect("/onboarding");

  const projects = await db.filmStudioProject.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">AI Film Studio</h1>
        <p className="text-studio-ink/60 dark:text-white/60">
          Full production packages for shoots outside the weekly PBL cycle — festival entries,
          extracurricular productions, anything you&apos;re planning independently.
        </p>
      </div>

      <FilmStudioGeneratorForm basePath="/teacher/dashboard/film-studio" />

      <Card>
        <CardHeader>
          <CardTitle>Library</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">No productions generated yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between">
                  <Link href={`/teacher/dashboard/film-studio/${project.id}`} className="hover:text-studio-accent">
                    {project.title}
                  </Link>
                  <span className="text-xs text-studio-ink/50 dark:text-white/50">{project.genre}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
