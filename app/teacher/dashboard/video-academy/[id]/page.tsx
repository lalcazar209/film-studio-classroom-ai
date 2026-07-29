import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GammaExportButton } from "@/components/gamma-export-button";
import { TUTORIAL_CATEGORY_LABELS } from "@/lib/constants/tutorial-categories";
import type { TutorialSegment } from "@/lib/ai/schemas";

export default async function TutorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/dashboard/video-academy/${id}`);

  const tutorial = await db.tutorialVideo.findUnique({ where: { id } });
  if (!tutorial) notFound();
  if (tutorial.organizationId !== session.user.organizationId) redirect("/unauthorized");

  const segments = tutorial.segments as unknown as TutorialSegment[];
  const practiceActivity = tutorial.practiceActivity as { title: string; instructions: string; estimatedMinutes: number };
  const quiz = tutorial.quiz as { title: string; questions: Array<{ prompt: string; answer: string }> };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <p className="text-sm uppercase tracking-wide text-studio-accent">
          {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
        </p>
        <h1 className="font-display text-3xl font-extrabold">{tutorial.title}</h1>
        <p className="mt-1 text-studio-ink/60 dark:text-white/60">{tutorial.learningObjective}</p>
        <div className="mt-3 flex gap-4 text-sm">
          <a href={`/api/video-academy/${tutorial.id}/transcript`} className="text-studio-accent hover:underline">
            Download transcript
          </a>
          <a href={`/api/video-academy/${tutorial.id}/captions`} className="text-studio-accent hover:underline">
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

      <Card>
        <CardHeader>
          <CardTitle>Teacher script</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">{tutorial.teacherScript}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shot list / narration segments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {segments.map((segment, i) => (
            <div key={i} className="border-b border-studio-ink/10 pb-3 text-sm last:border-0 dark:border-white/10">
              <p className="font-medium">
                {formatTime(segment.startSeconds)}–{formatTime(segment.endSeconds)}
                {segment.shotType ? ` · ${segment.shotType}` : ""}
              </p>
              <p className="mt-1">{segment.narration}</p>
              <p className="mt-1 text-studio-ink/60 dark:text-white/60">Visual: {segment.visualGuide}</p>
              {segment.graphicsNote && (
                <p className="text-studio-ink/60 dark:text-white/60">Graphics: {segment.graphicsNote}</p>
              )}
              {segment.animationSuggestion && (
                <p className="text-studio-ink/60 dark:text-white/60">Animation: {segment.animationSuggestion}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice activity — {practiceActivity.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{practiceActivity.instructions}</p>
          <p className="mt-1 text-studio-ink/60 dark:text-white/60">~{practiceActivity.estimatedMinutes} minutes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embedded quiz — {quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {quiz.questions.map((q, i) => (
            <p key={i}>
              {i + 1}. {q.prompt}
            </p>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
