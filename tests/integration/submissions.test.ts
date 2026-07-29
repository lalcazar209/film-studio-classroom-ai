import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { submitWork, SubmissionError } from "@/lib/submissions";
import { saveDemoReel, DemoReelError } from "@/lib/demo-reel";

const db = new PrismaClient();
let classPeriodId: string;
let studentId: string;
let otherStudentId: string;
let projectId: string;
let submissionId: string;

beforeAll(async () => {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });
  const students = await db.user.findMany({ where: { organizationId: classPeriod.organizationId, role: "STUDENT" }, take: 2 });
  classPeriodId = classPeriod.id;
  studentId = students[0]!.id;
  otherStudentId = students[1]!.id;
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  const project = await db.project.create({
    data: { title: "Vitest Submission Project", category: "SHORT_FILM", status: "READY", classPeriodId, brief: "test" },
  });
  const submission = await db.submission.create({ data: { projectId: project.id, studentId } });
  projectId = project.id;
  submissionId = submission.id;
});

afterEach(async () => {
  await db.portfolioItem.deleteMany({ where: { projectId } });
  await db.submission.deleteMany({ where: { projectId } });
  await db.project.deleteMany({ where: { id: projectId } });
});

describe("submitWork", () => {
  it("marks the submission SUBMITTED and sets submittedAt", async () => {
    const updated = await submitWork({ submissionId, studentId, videoUrl: "https://youtube.com/watch?v=1" });
    expect(updated.status).toBe("SUBMITTED");
    expect(updated.submittedAt).not.toBeNull();
  });

  it("auto-archives the submission into the student's portfolio", async () => {
    await submitWork({ submissionId, studentId, videoUrl: "https://youtube.com/watch?v=1", reflection: "Learned a lot." });

    const archive = await db.portfolioItem.findFirst({ where: { userId: studentId, projectId, type: "PROJECT_ARCHIVE" } });
    expect(archive).not.toBeNull();
    expect(archive?.assetUrl).toBe("https://youtube.com/watch?v=1");
  });

  it("resubmitting updates the existing archive instead of creating a duplicate", async () => {
    await submitWork({ submissionId, studentId, videoUrl: "https://youtube.com/watch?v=1" });
    await submitWork({ submissionId, studentId, videoUrl: "https://youtube.com/watch?v=2" });

    const count = await db.portfolioItem.count({ where: { userId: studentId, projectId, type: "PROJECT_ARCHIVE" } });
    expect(count).toBe(1);
  });

  it("rejects submitting someone else's submission", async () => {
    await expect(
      submitWork({ submissionId, studentId: otherStudentId, videoUrl: "https://example.com" }),
    ).rejects.toBeInstanceOf(SubmissionError);
  });
});

describe("saveDemoReel", () => {
  afterEach(async () => {
    await db.portfolioItem.deleteMany({ where: { userId: studentId, type: "DEMO_REEL" } });
  });

  it("creates a demo reel portfolio item from the student's own submission", async () => {
    const reel = await saveDemoReel(studentId, "My Reel", [
      { submissionId, title: "Test clip", videoUrl: "https://youtube.com/watch?v=1" },
    ]);
    expect(reel.type).toBe("DEMO_REEL");
  });

  it("rejects a clip referencing a submission the student doesn't own", async () => {
    await expect(
      saveDemoReel(studentId, "Sneaky Reel", [{ submissionId: "not-mine-and-fake", title: "x", videoUrl: "https://example.com" }]),
    ).rejects.toBeInstanceOf(DemoReelError);
  });

  it("saving again upserts rather than duplicating", async () => {
    await saveDemoReel(studentId, "Reel 1", [{ submissionId, title: "a", videoUrl: "https://youtube.com/watch?v=1" }]);
    await saveDemoReel(studentId, "Reel 2", [{ submissionId, title: "b", videoUrl: "https://youtube.com/watch?v=2" }]);

    const count = await db.portfolioItem.count({ where: { userId: studentId, type: "DEMO_REEL" } });
    expect(count).toBe(1);
  });
});
