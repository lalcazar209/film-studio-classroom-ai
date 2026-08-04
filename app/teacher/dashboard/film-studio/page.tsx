import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
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
    <CinemaPage
      title="AI Film Studio"
      description="Full production packages for shoots outside the weekly PBL cycle — festival entries, extracurricular productions, anything you're planning independently."
    >
      <div className="space-y-6">
        <FilmStudioGeneratorForm basePath="/teacher/dashboard/film-studio" theme="cinema" />

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Library</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-cinema-muted">No productions generated yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between">
                    <Link href={`/teacher/dashboard/film-studio/${project.id}`} className="text-cinema-white hover:text-cinema-red">
                      {project.title}
                    </Link>
                    <span className="text-xs text-cinema-muted">{project.genre}</span>
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
