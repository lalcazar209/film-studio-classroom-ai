import { db } from "@/lib/db";

export class SubmissionError extends Error {}

export interface SubmitWorkInput {
  submissionId: string;
  studentId: string;
  videoUrl: string;
  reflection?: string;
  selfAssess?: { rating: number; notes: string };
}

/**
 * A student turning in work does two things at once: it updates the
 * Submission, and it archives the project into the student's Digital
 * Portfolio automatically — nobody should have to remember to "add this to
 * my portfolio" separately from turning it in.
 */
export async function submitWork(input: SubmitWorkInput) {
  return db.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: input.submissionId },
      include: { project: true },
    });
    if (!submission) throw new SubmissionError("Submission not found");
    if (submission.studentId !== input.studentId) {
      throw new SubmissionError("This is not your submission");
    }

    const updated = await tx.submission.update({
      where: { id: input.submissionId },
      data: {
        videoUrl: input.videoUrl,
        reflection: input.reflection,
        selfAssess: input.selfAssess,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    const existingArchive = await tx.portfolioItem.findFirst({
      where: { userId: input.studentId, projectId: submission.projectId, type: "PROJECT_ARCHIVE" },
    });

    if (existingArchive) {
      await tx.portfolioItem.update({
        where: { id: existingArchive.id },
        data: { assetUrl: input.videoUrl, metadata: { reflection: input.reflection } },
      });
    } else {
      await tx.portfolioItem.create({
        data: {
          userId: input.studentId,
          projectId: submission.projectId,
          type: "PROJECT_ARCHIVE",
          title: submission.project.title,
          assetUrl: input.videoUrl,
          metadata: { reflection: input.reflection },
        },
      });
    }

    return updated;
  });
}
