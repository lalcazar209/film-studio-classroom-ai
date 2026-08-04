import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { ProjectGeneratorForm } from "@/components/project-generator-form";

export default async function ProjectGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/project-generator");

  const classPeriods = await db.classPeriod.findMany({
    where: { teacherId: session.user.id },
    select: { id: true, name: true, gradeLevel: true },
    orderBy: { name: "asc" },
  });

  return (
    <CinemaPage
      eyebrow="AI-powered"
      title="Project Generator"
      description="Every project you generate here cascades into slides, worksheets, a rubric, a quiz, vocabulary, a storyboard, and a production plan for the whole class week."
    >
      {classPeriods.length === 0 ? (
        <p className="rounded-xl border border-cinema-border bg-cinema-black/40 p-4 text-sm text-cinema-white">
          You don&apos;t have any class periods yet. Create one from the Teacher Portal before
          generating a project.
        </p>
      ) : (
        <ProjectGeneratorForm classPeriods={classPeriods} />
      )}
    </CinemaPage>
  );
}
