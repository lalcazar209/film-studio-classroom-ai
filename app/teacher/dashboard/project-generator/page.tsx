import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Project Generator</h1>
      <p className="mt-1 text-black/60 dark:text-white/60">
        Every project you generate here cascades into slides, worksheets, a rubric, a quiz,
        vocabulary, a storyboard, and a production plan for the whole class week.
      </p>

      <div className="mt-6">
        {classPeriods.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
            You don&apos;t have any class periods yet. Create one from the Teacher Portal before
            generating a project.
          </p>
        ) : (
          <ProjectGeneratorForm classPeriods={classPeriods} />
        )}
      </div>
    </main>
  );
}
