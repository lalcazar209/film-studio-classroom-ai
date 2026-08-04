import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
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
    <CinemaPage title={`Submissions: ${project.title}`} description={project.classPeriod.name}>
      <div className="space-y-6">
        {project.submissions.map((submission) => (
          <CinemaCard key={submission.id}>
            <CinemaCardHeader>
              <CinemaCardTitle className="flex items-center justify-between text-base">
                <span>{submission.student.name ?? submission.student.email}</span>
                <span className="text-xs font-normal text-cinema-muted">{submission.status}</span>
              </CinemaCardTitle>
            </CinemaCardHeader>
            <CinemaCardContent>
              {submission.videoUrl && (
                <a
                  href={submission.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 block text-sm text-cinema-red hover:underline"
                >
                  View video
                </a>
              )}
              <VideoReviewPanel
                submissionId={submission.id}
                initialReview={submission.aiReview as unknown as VideoReview | null}
                hasVideo={Boolean(submission.videoUrl)}
              />
            </CinemaCardContent>
          </CinemaCard>
        ))}
      </div>
    </CinemaPage>
  );
}
