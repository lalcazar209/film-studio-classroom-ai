import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TUTORIAL_CATEGORY_LABELS } from "@/lib/constants/tutorial-categories";
import type { TutorialSegment } from "@/lib/ai/schemas";

export default async function StudentTutorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/student/dashboard/video-academy/${id}`);

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
        <h1 className="font-display text-3xl font-bold">{tutorial.title}</h1>
        <p className="mt-1 text-black/60 dark:text-white/60">{tutorial.learningObjective}</p>
        <div className="mt-3 flex gap-4 text-sm">
          <a href={`/api/video-academy/${tutorial.id}/transcript`} className="text-studio-accent hover:underline">
            Read transcript
          </a>
          <a href={`/api/video-academy/${tutorial.id}/captions`} className="text-studio-accent hover:underline">
            Download captions (.srt)
          </a>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>What you&apos;ll learn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {segments.map((segment, i) => (
            <p key={i}>{segment.narration}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Try it — {practiceActivity.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{practiceActivity.instructions}</p>
          <p className="mt-1 text-black/60 dark:text-white/60">~{practiceActivity.estimatedMinutes} minutes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick check — {quiz.title}</CardTitle>
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
