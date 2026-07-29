import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { videoReviewSchema, type VideoReview } from "./schemas";
import type { AIContentBlock } from "./provider";
import { getVideoThumbnailUrls } from "@/lib/integrations/cloudinary";
import { fetchImageAsDataUri } from "./media";

const FRAME_OFFSETS_SECONDS = [1, 4, 8, 14, 22];

const SYSTEM_PROMPT = `You are the AI Video Review assistant for Film Studio Classroom AI. A
teacher has asked you to review a student's submitted film/TV production project. Analyze what
is shown across the provided video frames (if any) plus the project context, and return
structured, specific, actionable feedback a film production teacher could actually use to grade
and coach the student — not generic praise.

If no video frames were provided, you are working from metadata only (title, category, student
reflection). Say so plainly in overallSummary and set analyzedVisualFrames to false. Do not
invent visual details (lighting, composition, exposure) you cannot see — in that case give those
categories a neutral score of 5 and say in the feedback that visual analysis requires an uploaded
video file.

For copyrightConcerns: flag anything that reads like unlicensed commercial music, copyrighted
footage, or trademarked logos based on what's described/visible — an empty array is a fine and
common answer, don't invent concerns.

Respond with ONLY a single JSON object matching the required schema. No prose, no markdown fences.`;

export async function generateVideoReview(submissionId: string) {
  const submission = await db.submission.findUniqueOrThrow({
    where: { id: submissionId },
    include: { project: { include: { rubric: true } }, student: true },
  });

  if (!submission.videoUrl) {
    throw new Error("This submission has no video to review yet");
  }

  const thumbnailUrls = getVideoThumbnailUrls(submission.videoUrl, FRAME_OFFSETS_SECONDS);

  const imageBlocks: AIContentBlock[] = [];
  if (thumbnailUrls) {
    const dataUris = await Promise.allSettled(thumbnailUrls.map((url) => fetchImageAsDataUri(url)));
    for (const result of dataUris) {
      if (result.status === "fulfilled") {
        imageBlocks.push({ type: "image", dataUri: result.value });
      }
    }
  }

  const contextText = [
    `Project: ${submission.project.title} (${submission.project.category})`,
    `Student: ${submission.student.name ?? submission.student.email}`,
    submission.reflection ? `Student reflection: ${submission.reflection}` : null,
    submission.project.rubric ? `Rubric: ${submission.project.rubric.title}` : null,
    imageBlocks.length
      ? `${imageBlocks.length} frames extracted from the video are attached below, sampled at roughly ${FRAME_OFFSETS_SECONDS.slice(0, imageBlocks.length).join("s, ")}s into the video.`
      : "No video frames could be extracted (the video was not uploaded through this platform's Cloudinary pipeline, so only metadata is available).",
  ]
    .filter(Boolean)
    .join("\n");

  const provider = getAIProvider();
  const result = await provider.generate({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: [{ type: "text", text: contextText }, ...imageBlocks] },
    ],
    maxTokens: 2048,
    temperature: 0.4,
  });

  const parsed = safeParseJson(result.text);
  const validated = videoReviewSchema.parse(parsed);

  await db.submission.update({
    where: { id: submissionId },
    data: { aiReview: validated, status: submission.status === "SUBMITTED" ? "REVIEWED" : submission.status },
  });

  return validated as VideoReview;
}

function safeParseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "");
  return JSON.parse(trimmed);
}
