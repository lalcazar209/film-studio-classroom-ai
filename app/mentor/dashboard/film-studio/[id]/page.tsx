import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FilmStudioProjectView } from "@/components/film-studio-project-view";
import type { FilmStudioBundle } from "@/lib/ai/schemas";

export default async function MentorFilmStudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/mentor/dashboard/film-studio/${id}`);

  const project = await db.filmStudioProject.findUnique({ where: { id } });
  if (!project) notFound();
  if (project.organizationId !== session.user.organizationId) redirect("/unauthorized");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <FilmStudioProjectView
        title={project.title}
        logline={project.logline}
        genre={project.genre}
        screenplay={project.screenplay as unknown as FilmStudioBundle["screenplay"]}
        shotList={project.shotList as unknown as FilmStudioBundle["shotList"]}
        callSheet={project.callSheet as unknown as FilmStudioBundle["callSheet"]}
        budget={project.budget as unknown as FilmStudioBundle["budget"]}
        equipmentList={project.equipmentList as unknown as FilmStudioBundle["equipmentList"]}
        locationPlan={project.locationPlan as unknown as FilmStudioBundle["locationPlan"]}
        castingSheet={project.castingSheet as unknown as FilmStudioBundle["castingSheet"]}
        marketingPlan={project.marketingPlan as unknown as FilmStudioBundle["marketingPlan"]}
      />
    </main>
  );
}
