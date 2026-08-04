import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
import { GammaExportButton } from "@/components/gamma-export-button";
import { TUTORIAL_CATEGORY_LABELS } from "@/lib/constants/tutorial-categories";
import { TutorialNarrationPlayer } from "@/components/tutorial-narration-player";
import type { NarratedSegment } from "@/lib/ai/video-narration-service";

export default async function TutorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/dashboard/video-academy/${id}`);

  const tutorial = await db.tutorialVideo.findUnique({ where: { id } });
  if (!tutorial) notFound();
  if (tutorial.organizationId !== session.user.organizationId) redirect("/unauthorized");

  const segments = tutorial.segments as unknown as NarratedSegment[];
  const practiceActivity = tutorial.practiceActivity as { title: string; instructions: string; estimatedMinutes: number };
  const quiz = tutorial.quiz as { title: string; questions: Array<{ prompt: string; answer: string }> };

  return (
    <main className="relative mx-auto max-w-3xl space-y-6 overflow-hidden rounded-3xl bg-cinema-charcoal px-4 py-10 shadow-cinema-panel">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" />
      <div className="relative space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wide text-cinema-red">
            {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
          </p>
          <h1 className="text-3xl font-extrabold text-cinema-white">{tutorial.title}</h1>
          <p className="mt-1 text-cinema-muted">{tutorial.learningObjective}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a href={`/api/video-academy/${tutorial.id}/transcript`} className="text-cinema-red hover:underline">
              Download transcript
            </a>
            <a href={`/api/video-academy/${tutorial.id}/captions`} className="text-cinema-red hover:underline">
              Download captions (.srt)
            </a>
          </div>
          <div className="mt-3">
            <GammaExportButton
              exportUrl={`/api/video-academy/${tutorial.id}/export/gamma`}
              initialGammaUrl={tutorial.gammaUrl}
            />
          </div>
        </header>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Watch / generate narration</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            <TutorialNarrationPlayer
              tutorialId={tutorial.id}
              initialSegments={segments}
              initialNarrationGenerated={tutorial.narrationGeneratedAt !== null}
              canGenerate={true}
              theme="cinema"
            />
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Teacher script</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="whitespace-pre-wrap text-sm text-cinema-white/80">
            {tutorial.teacherScript}
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Shot list / narration segments</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="space-y-4">
            {segments.map((segment, i) => (
              <div key={i} className="border-b border-cinema-border pb-3 text-sm last:border-0">
                <p className="font-medium text-cinema-white">
                  {formatTime(segment.startSeconds)}–{formatTime(segment.endSeconds)}
                  {segment.shotType ? ` · ${segment.shotType}` : ""}
                </p>
                <p className="mt-1 text-cinema-white/80">{segment.narration}</p>
                <p className="mt-1 text-cinema-muted">Visual: {segment.visualGuide}</p>
                {segment.graphicsNote && <p className="text-cinema-muted">Graphics: {segment.graphicsNote}</p>}
                {segment.animationSuggestion && <p className="text-cinema-muted">Animation: {segment.animationSuggestion}</p>}
              </div>
            ))}
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Practice activity — {practiceActivity.title}</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="text-sm text-cinema-white/80">
            <p>{practiceActivity.instructions}</p>
            <p className="mt-1 text-cinema-muted">~{practiceActivity.estimatedMinutes} minutes</p>
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Embedded quiz — {quiz.title}</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="space-y-2 text-sm text-cinema-white/80">
            {quiz.questions.map((q, i) => (
              <p key={i}>
                {i + 1}. {q.prompt}
              </p>
            ))}
          </CinemaCardContent>
        </CinemaCard>
      </div>
    </main>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
