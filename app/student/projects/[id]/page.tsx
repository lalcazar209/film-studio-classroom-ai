import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";
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
    <main className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-cinema-charcoal px-4 py-6 text-cinema-white shadow-cinema-panel sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />
      <div className="relative space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wide text-cinema-red">
            {PROJECT_CATEGORY_LABELS[project.category]}
          </p>
          <h1 className="font-display text-3xl font-extrabold">{project.title}</h1>
          <p className="mt-1 text-cinema-muted">{project.classPeriod.name}</p>
        </header>

        {lessons.map((lesson) => (
          <CinemaCard key={lesson.id}>
            <CinemaCardHeader>
              <CinemaCardTitle>
                {DAY_LABELS[lesson.day]}: {lesson.title}
              </CinemaCardTitle>
            </CinemaCardHeader>
            <CinemaCardContent className="text-sm">
              <p>{lesson.iCanStatement}</p>
            </CinemaCardContent>
          </CinemaCard>
        ))}

        {project.rubric && (
          <CinemaCard>
            <CinemaCardHeader>
              <CinemaCardTitle>Rubric — {project.rubric.title}</CinemaCardTitle>
            </CinemaCardHeader>
            <CinemaCardContent className="text-sm text-cinema-muted">
              {(project.rubric.criteria as Array<{ name: string; weightPercent: number }>).map((c) => (
                <div key={c.name} className="flex justify-between py-1">
                  <span>{c.name}</span>
                  <span>{c.weightPercent}%</span>
                </div>
              ))}
            </CinemaCardContent>
          </CinemaCard>
        )}

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>{submission?.status === "SUBMITTED" ? "Your submission" : "Submit your work"}</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            {submission ? (
              <SubmissionForm
                submissionId={submission.id}
                initialVideoUrl={submission.videoUrl}
                initialReflection={submission.reflection}
              />
            ) : (
              <p className="text-sm text-cinema-muted">No submission record found for this project yet.</p>
            )}
          </CinemaCardContent>
        </CinemaCard>
      </div>
    </main>
  );
}
