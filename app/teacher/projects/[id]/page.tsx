import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GammaExportButton } from "@/components/gamma-export-button";
import { GoogleDocsExportButton } from "@/components/google-docs-export-button";
import { ClassroomExportButton } from "@/components/classroom-export-button";
import { CoverImagePanel } from "@/components/cover-image-panel";
import { StoryboardShots } from "@/components/storyboard-shots";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};

const DAY_ORDER = Object.keys(DAY_LABELS);

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/projects/${id}`);

  const project = await db.project.findUnique({
    where: { id },
    include: {
      classPeriod: true,
      lessons: { include: { standards: { include: { standard: true } } } },
      rubric: true,
      quiz: true,
      vocabulary: true,
      storyboard: true,
      productionPlan: true,
    },
  });

  if (!project) notFound();
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const lessons = [...project.lessons].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-studio-accent">
            {PROJECT_CATEGORY_LABELS[project.category]}
          </p>
          <h1 className="font-display text-3xl font-extrabold">{project.title}</h1>
          <p className="mt-1 text-studio-ink/60 dark:text-white/60">{project.classPeriod.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/projects/${project.id}/submissions`}>
            <Button variant="secondary">Submissions</Button>
          </Link>
          <Link href={`/teacher/projects/${project.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
        </div>
      </header>

      <CoverImagePanel projectId={project.id} initialCoverImageUrl={project.coverImageUrl} />

      <div className="grid gap-6 md:grid-cols-5">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="md:col-span-5">
            <CardHeader>
              <CardTitle>{DAY_LABELS[lesson.day]}: {lesson.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Objective: </span>
                {lesson.objective}
              </p>
              <p>
                <span className="font-medium">I can: </span>
                {lesson.iCanStatement}
              </p>
              {lesson.standards.length > 0 && (
                <p className="text-xs text-studio-ink/50 dark:text-white/50">
                  Standards: {lesson.standards.map((s) => s.standard.code).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <a href={`/api/projects/${project.id}/export/pdf`} className="text-sm text-studio-accent hover:underline">
            Download PDF
          </a>
          <a href={`/api/projects/${project.id}/export/docx`} className="text-sm text-studio-accent hover:underline">
            Download Word
          </a>
          <a href={`/api/projects/${project.id}/export/pptx`} className="text-sm text-studio-accent hover:underline">
            Download PowerPoint
          </a>
          <GammaExportButton exportUrl={`/api/projects/${project.id}/export/gamma`} initialGammaUrl={project.gammaUrl} />
          <GoogleDocsExportButton
            exportUrl={`/api/projects/${project.id}/export/google-docs`}
            initialGoogleDocUrl={project.googleDocUrl}
          />
          <ClassroomExportButton
            exportUrl={`/api/projects/${project.id}/export/classroom`}
            initialClassroomUrl={project.classroomUrl}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {project.rubric && (
          <Card>
            <CardHeader>
              <CardTitle>Rubric — {project.rubric.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-studio-ink/70 dark:text-white/70">
              {(project.rubric.criteria as Array<{ name: string; weightPercent: number }>).map(
                (criterion) => (
                  <div key={criterion.name} className="flex justify-between py-1">
                    <span>{criterion.name}</span>
                    <span>{criterion.weightPercent}%</span>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        )}

        {project.quiz && (
          <Card>
            <CardHeader>
              <CardTitle>Quiz — {project.quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-studio-ink/70 dark:text-white/70">
              {(project.quiz.questions as Array<{ prompt: string }>).length} questions generated
            </CardContent>
          </Card>
        )}
      </div>

      {project.vocabulary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            {project.vocabulary.map((term) => (
              <div key={term.id}>
                <span className="font-medium">{term.term}: </span>
                {term.definition}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {project.storyboard && (
        <Card>
          <CardHeader>
            <CardTitle>Storyboard</CardTitle>
          </CardHeader>
          <CardContent>
            <StoryboardShots
              projectId={project.id}
              shots={
                project.storyboard.shots as unknown as Array<{
                  number: number;
                  description: string;
                  shotType: string;
                  movement: string;
                  lighting: string;
                  audio: string;
                  durationSec: number;
                  imageUrl?: string;
                }>
              }
            />
          </CardContent>
        </Card>
      )}

      {project.productionPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Production Plan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-studio-ink/70 dark:text-white/70">
            {(project.productionPlan.crewRoles as Array<{ role: string; responsibilities: string }>).map(
              (crew) => (
                <p key={crew.role}>
                  <span className="font-medium">{crew.role}: </span>
                  {crew.responsibilities}
                </p>
              ),
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
