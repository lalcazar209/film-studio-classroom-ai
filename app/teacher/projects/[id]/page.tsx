import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
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
    <main className="relative mx-auto max-w-4xl space-y-6 overflow-hidden rounded-3xl bg-cinema-charcoal px-4 py-10 shadow-cinema-panel">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" />
      <div className="relative space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-cinema-red">
              {PROJECT_CATEGORY_LABELS[project.category]}
            </p>
            <h1 className="text-3xl font-extrabold text-cinema-white">{project.title}</h1>
            <p className="mt-1 text-cinema-muted">{project.classPeriod.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/teacher/projects/${project.id}/submissions`}>
              <Button variant="cinema-secondary">Submissions</Button>
            </Link>
            <Link href={`/teacher/projects/${project.id}/edit`}>
              <Button variant="cinema-secondary">Edit</Button>
            </Link>
          </div>
        </header>

        <CoverImagePanel projectId={project.id} initialCoverImageUrl={project.coverImageUrl} />

        <div className="grid gap-6 md:grid-cols-5">
          {lessons.map((lesson) => (
            <CinemaCard key={lesson.id} className="md:col-span-5">
              <CinemaCardHeader>
                <CinemaCardTitle>{DAY_LABELS[lesson.day]}: {lesson.title}</CinemaCardTitle>
              </CinemaCardHeader>
              <CinemaCardContent className="space-y-3 text-sm text-cinema-white/80">
                <p>
                  <span className="font-medium text-cinema-white">Objective: </span>
                  {lesson.objective}
                </p>
                <p>
                  <span className="font-medium text-cinema-white">I can: </span>
                  {lesson.iCanStatement}
                </p>
                {lesson.standards.length > 0 && (
                  <p className="text-xs text-cinema-muted">
                    Standards: {lesson.standards.map((s) => s.standard.code).join(", ")}
                  </p>
                )}
              </CinemaCardContent>
            </CinemaCard>
          ))}
        </div>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Export</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="flex flex-wrap items-center gap-4">
            <a href={`/api/projects/${project.id}/export/pdf`} className="text-sm text-cinema-red hover:underline">
              Download PDF
            </a>
            <a href={`/api/projects/${project.id}/export/docx`} className="text-sm text-cinema-red hover:underline">
              Download Word
            </a>
            <a href={`/api/projects/${project.id}/export/pptx`} className="text-sm text-cinema-red hover:underline">
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
          </CinemaCardContent>
        </CinemaCard>

        <div className="grid gap-6 md:grid-cols-2">
          {project.rubric && (
            <CinemaCard>
              <CinemaCardHeader>
                <CinemaCardTitle>Rubric — {project.rubric.title}</CinemaCardTitle>
              </CinemaCardHeader>
              <CinemaCardContent className="text-sm text-cinema-white/80">
                {(project.rubric.criteria as Array<{ name: string; weightPercent: number }>).map(
                  (criterion) => (
                    <div key={criterion.name} className="flex justify-between py-1">
                      <span>{criterion.name}</span>
                      <span>{criterion.weightPercent}%</span>
                    </div>
                  ),
                )}
              </CinemaCardContent>
            </CinemaCard>
          )}

          {project.quiz && (
            <CinemaCard>
              <CinemaCardHeader>
                <CinemaCardTitle>Quiz — {project.quiz.title}</CinemaCardTitle>
              </CinemaCardHeader>
              <CinemaCardContent className="text-sm text-cinema-white/80">
                {(project.quiz.questions as Array<{ prompt: string }>).length} questions generated
              </CinemaCardContent>
            </CinemaCard>
          )}
        </div>

        {project.vocabulary.length > 0 && (
          <CinemaCard>
            <CinemaCardHeader>
              <CinemaCardTitle>Vocabulary</CinemaCardTitle>
            </CinemaCardHeader>
            <CinemaCardContent className="grid gap-2 text-sm text-cinema-white/80 md:grid-cols-2">
              {project.vocabulary.map((term) => (
                <div key={term.id}>
                  <span className="font-medium text-cinema-white">{term.term}: </span>
                  {term.definition}
                </div>
              ))}
            </CinemaCardContent>
          </CinemaCard>
        )}

        {project.storyboard && (
          <CinemaCard>
            <CinemaCardHeader>
              <CinemaCardTitle>Storyboard</CinemaCardTitle>
            </CinemaCardHeader>
            <CinemaCardContent>
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
            </CinemaCardContent>
          </CinemaCard>
        )}

        {project.productionPlan && (
          <CinemaCard>
            <CinemaCardHeader>
              <CinemaCardTitle>Production Plan</CinemaCardTitle>
            </CinemaCardHeader>
            <CinemaCardContent className="text-sm text-cinema-white/80">
              {(project.productionPlan.crewRoles as Array<{ role: string; responsibilities: string }>).map(
                (crew) => (
                  <p key={crew.role}>
                    <span className="font-medium text-cinema-white">{crew.role}: </span>
                    {crew.responsibilities}
                  </p>
                ),
              )}
            </CinemaCardContent>
          </CinemaCard>
        )}
      </div>
    </main>
  );
}
