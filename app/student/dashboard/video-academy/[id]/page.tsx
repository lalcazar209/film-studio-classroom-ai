import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";
import { TUTORIAL_CATEGORY_LABELS } from "@/lib/constants/tutorial-categories";
import { TutorialNarrationPlayer } from "@/components/tutorial-narration-player";
import type { NarratedSegment } from "@/lib/ai/video-narration-service";

export default async function StudentTutorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/student/dashboard/video-academy/${id}`);

  const tutorial = await db.tutorialVideo.findUnique({ where: { id } });
  if (!tutorial) notFound();
  if (tutorial.organizationId !== session.user.organizationId) redirect("/unauthorized");

  const segments = tutorial.segments as unknown as NarratedSegment[];
  const practiceActivity = tutorial.practiceActivity as { title: string; instructions: string; estimatedMinutes: number };
  const quiz = tutorial.quiz as { title: string; questions: Array<{ prompt: string; answer: string }> };

  return (
    <main className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-cinema-charcoal px-4 py-6 text-cinema-white shadow-cinema-panel sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />
      <div className="relative space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wide text-cinema-red">
            {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
          </p>
          <h1 className="font-display text-3xl font-extrabold">{tutorial.title}</h1>
          <p className="mt-1 text-cinema-muted">{tutorial.learningObjective}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a href={`/api/video-academy/${tutorial.id}/transcript`} className="text-cinema-red hover:underline">
              Read transcript
            </a>
            <a href={`/api/video-academy/${tutorial.id}/captions`} className="text-cinema-red hover:underline">
              Download captions (.srt)
            </a>
          </div>
        </header>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Watch</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            <TutorialNarrationPlayer
              tutorialId={tutorial.id}
              initialSegments={segments}
              initialNarrationGenerated={tutorial.narrationGeneratedAt !== null}
              canGenerate={false}
              theme="cinema"
            />
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Try it — {practiceActivity.title}</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="text-sm">
            <p>{practiceActivity.instructions}</p>
            <p className="mt-1 text-cinema-muted">~{practiceActivity.estimatedMinutes} minutes</p>
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Quick check — {quiz.title}</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="space-y-2 text-sm">
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
