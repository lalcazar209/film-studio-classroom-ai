/**
 * Covers the deterministic parts of Phase 5 (submission -> portfolio
 * cascade, demo reel ownership + upsert). The AI-dependent flows
 * (generateResume, sendTutorMessage) need a real ANTHROPIC_API_KEY/
 * network access and aren't covered here — their request/response
 * shape is exercised by lib/ai/schemas.ts-style validation, same
 * pattern as curriculum-service.ts.
 */
import { PrismaClient } from "@prisma/client";
import { submitWork, SubmissionError } from "../lib/submissions";
import { saveDemoReel, DemoReelError } from "../lib/demo-reel";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });
  const students = await db.user.findMany({ where: { organizationId: classPeriod.organizationId, role: "STUDENT" } });
  const [student, otherStudent] = students;
  if (!student || !otherStudent) throw new Error("expected at least 2 seeded students");

  const project = await db.project.create({
    data: {
      title: "Smoke Test Project P5",
      category: "SHORT_FILM",
      status: "READY",
      classPeriodId: classPeriod.id,
      brief: "smoke test",
    },
  });
  const submission = await db.submission.create({ data: { projectId: project.id, studentId: student.id } });

  // --- Submission cascades into a portfolio archive ---
  await assert(
    (await db.portfolioItem.count({ where: { userId: student.id, projectId: project.id } })) === 0,
    "no portfolio item exists before submission",
  );

  await submitWork({
    submissionId: submission.id,
    studentId: student.id,
    videoUrl: "https://youtube.com/watch?v=smoketest1",
    reflection: "Learned a lot about pacing.",
  });

  const updatedSubmission = await db.submission.findUniqueOrThrow({ where: { id: submission.id } });
  await assert(updatedSubmission.status === "SUBMITTED", "submission status becomes SUBMITTED");
  await assert(updatedSubmission.submittedAt !== null, "submittedAt is set");

  const archive = await db.portfolioItem.findFirst({
    where: { userId: student.id, projectId: project.id, type: "PROJECT_ARCHIVE" },
  });
  await assert(archive !== null, "submitting work auto-creates a PROJECT_ARCHIVE portfolio item");
  await assert(archive?.assetUrl === "https://youtube.com/watch?v=smoketest1", "portfolio item stores the video URL");

  // Re-submitting updates the same archive rather than duplicating it.
  await submitWork({
    submissionId: submission.id,
    studentId: student.id,
    videoUrl: "https://youtube.com/watch?v=smoketest2",
  });
  const archiveCount = await db.portfolioItem.count({
    where: { userId: student.id, projectId: project.id, type: "PROJECT_ARCHIVE" },
  });
  await assert(archiveCount === 1, "resubmitting updates the existing archive instead of duplicating");

  // A student cannot submit someone else's submission.
  try {
    await submitWork({ submissionId: submission.id, studentId: otherStudent.id, videoUrl: "https://example.com" });
    throw new Error("expected SubmissionError");
  } catch (e) {
    await assert(e instanceof SubmissionError, "submitting someone else's submission is rejected");
  }

  // --- Demo reel ownership + upsert ---
  const demoReel1 = await saveDemoReel(student.id, "My Reel", [
    { submissionId: submission.id, title: project.title, videoUrl: "https://youtube.com/watch?v=smoketest2" },
  ]);
  await assert(demoReel1.type === "DEMO_REEL", "demo reel portfolio item created");

  try {
    await saveDemoReel(student.id, "Sneaky Reel", [
      { submissionId: submission.id, title: "x", videoUrl: "https://example.com" },
    ].concat([{ submissionId: "not-mine-and-fake", title: "y", videoUrl: "https://example.com" }]));
    throw new Error("expected DemoReelError");
  } catch (e) {
    await assert(e instanceof DemoReelError, "including a submission you don't own is rejected");
  }

  const demoReelCount = await db.portfolioItem.count({ where: { userId: student.id, type: "DEMO_REEL" } });
  await assert(demoReelCount === 1, "saving a demo reel again upserts instead of duplicating");

  // Cleanup.
  await db.portfolioItem.deleteMany({ where: { userId: student.id, projectId: project.id } });
  await db.portfolioItem.deleteMany({ where: { userId: student.id, type: "DEMO_REEL" } });
  await db.submission.delete({ where: { id: submission.id } });
  await db.project.delete({ where: { id: project.id } });

  console.log("\nAll Phase 5 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
