import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionForm } from "@/components/submission-form";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};
const DAY_ORDER = Object.keys(DAY_LABELS);

export default async function StudentProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/student/projects/${id}`);

  const project = await db.project.findUnique({
    where: { id },
    include: {
      classPeriod: true,
      lessons: true,
      rubric: true,
      vocabulary: true,
      submissions: { where: { studentId: session.user.id } },
    },
  });

  if (!project) notFound();

  const enrolled = await db.enrollment.findUnique({
    where: { studentId_classPeriodId: { studentId: session.user.id, classPeriodId: project.classPeriodId } },
  });
  if (!enrolled && session.user.role !== "ADMIN") redirect("/unauthorized");

  const submission = project.submissions[0];
  const lessons = [...project.lessons].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <p className="text-sm uppercase tracking-wide text-studio-accent">
          {PROJECT_CATEGORY_LABELS[project.category]}
        </p>
        <h1 className="font-display text-3xl font-bold">{project.title}</h1>
        <p className="mt-1 text-black/60 dark:text-white/60">{project.classPeriod.name}</p>
      </header>

      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardHeader>
            <CardTitle>{DAY_LABELS[lesson.day]}: {lesson.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{lesson.iCanStatement}</p>
          </CardContent>
        </Card>
      ))}

      {project.rubric && (
        <Card>
          <CardHeader>
            <CardTitle>Rubric — {project.rubric.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-black/70 dark:text-white/70">
            {(project.rubric.criteria as Array<{ name: string; weightPercent: number }>).map((c) => (
              <div key={c.name} className="flex justify-between py-1">
                <span>{c.name}</span>
                <span>{c.weightPercent}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{submission?.status === "SUBMITTED" ? "Your submission" : "Submit your work"}</CardTitle>
        </CardHeader>
        <CardContent>
          {submission ? (
            <SubmissionForm
              submissionId={submission.id}
              initialVideoUrl={submission.videoUrl}
              initialReflection={submission.reflection}
            />
          ) : (
            <p className="text-sm text-black/60 dark:text-white/60">
              No submission record found for this project yet.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
