import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectEditForm, type RubricCriterion, type QuizQuestion } from "@/components/project-edit-form";

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/projects/${id}/edit`);

  const project = await db.project.findUnique({
    where: { id },
    include: { classPeriod: true, lessons: true, rubric: true, quiz: true },
  });

  if (!project) notFound();
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  if (!project.rubric || !project.quiz) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Edit: {project.title}</h1>
        <p className="text-black/60 dark:text-white/60">
          Everything the AI generated is a starting point — change anything below.
        </p>
      </div>

      <ProjectEditForm
        projectId={project.id}
        initialLessons={project.lessons.map((l) => ({
          id: l.id,
          day: l.day,
          title: l.title,
          objective: l.objective,
          iCanStatement: l.iCanStatement,
          differentiation: l.differentiation as {
            accommodations: string[];
            extensions: string[];
            interventions: string[];
          },
        }))}
        initialRubric={{
          title: project.rubric.title,
          criteria: project.rubric.criteria as unknown as RubricCriterion[],
        }}
        initialQuiz={{
          title: project.quiz.title,
          questions: project.quiz.questions as unknown as QuizQuestion[],
        }}
      />
    </main>
  );
}
