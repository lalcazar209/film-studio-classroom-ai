import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoReviewPanel } from "@/components/video-review-panel";
import type { VideoReview } from "@/lib/ai/schemas";

export default async function ProjectSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/projects/${id}/submissions`);

  const project = await db.project.findUnique({
    where: { id },
    include: {
      classPeriod: true,
      submissions: { include: { student: true }, orderBy: { student: { name: "asc" } } },
    },
  });

  if (!project) notFound();
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Submissions: {project.title}</h1>
        <p className="text-studio-ink/60 dark:text-white/60">{project.classPeriod.name}</p>
      </div>

      {project.submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{submission.student.name ?? submission.student.email}</span>
              <span className="text-xs font-normal text-studio-ink/50 dark:text-white/50">{submission.status}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submission.videoUrl && (
              <a
                href={submission.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 block text-sm text-studio-accent hover:underline"
              >
                View video
              </a>
            )}
            <VideoReviewPanel
              submissionId={submission.id}
              initialReview={submission.aiReview as unknown as VideoReview | null}
              hasVideo={Boolean(submission.videoUrl)}
            />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
