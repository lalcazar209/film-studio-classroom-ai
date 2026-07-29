/**
 * Covers the deterministic parts of Phase 6: Cloudinary upload signing,
 * video-frame thumbnail URL construction, the base64 data-URI plumbing
 * shared by all three AI providers' image support, and the video review
 * schema. Does not call a real AI provider or Cloudinary account (no
 * credentials in this environment) — it spins up a throwaway local HTTP
 * server to exercise fetchImageAsDataUri against real bytes instead of
 * mocking fetch.
 */
import crypto from "node:crypto";
import http from "node:http";
import { createSignedUploadParams, getVideoThumbnailUrls } from "../lib/integrations/cloudinary";
import { fetchImageAsDataUri } from "../lib/ai/media";
import { toContentBlocks, parseDataUri } from "../lib/ai/provider";
import { videoReviewSchema } from "../lib/ai/schemas";

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

function cloudinarySignatureReference(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
}

async function main() {
  // --- Cloudinary upload signing ---
  const signed = createSignedUploadParams({ folder: "submissions/student-1", publicId: "sub-1-12345" });
  await assert(signed.cloudName === process.env.CLOUDINARY_CLOUD_NAME, "signed params echo the configured cloud name");
  const expectedSignature = cloudinarySignatureReference(
    { timestamp: signed.timestamp, folder: signed.folder, public_id: signed.publicId },
    process.env.CLOUDINARY_API_SECRET!,
  );
  await assert(signed.signature === expectedSignature, "signature matches an independent reference implementation");

  // --- Video thumbnail URL construction ---
  const cloudinaryUrl = "https://res.cloudinary.com/demo/video/upload/v1700000000/submissions/student1/abc-123.mp4";
  const thumbnails = getVideoThumbnailUrls(cloudinaryUrl, [1, 4, 8]);
  await assert(thumbnails !== null, "Cloudinary URLs produce thumbnail URLs");
  await assert(
    thumbnails![0] === "https://res.cloudinary.com/demo/video/upload/so_1,f_jpg/v1700000000/submissions/student1/abc-123.jpg",
    "thumbnail URL has the expected so_<t>,f_jpg transformation and .jpg extension",
  );
  await assert(thumbnails!.length === 3, "one thumbnail URL per requested offset");

  const nonCloudinaryThumbnails = getVideoThumbnailUrls("https://youtube.com/watch?v=xyz", [1, 4]);
  await assert(nonCloudinaryThumbnails === null, "non-Cloudinary URLs (e.g. a pasted YouTube link) return null, not a guess");

  // --- data URI plumbing shared by all three providers ---
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.from("fake-png-bytes-for-smoke-test"));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;

  try {
    const dataUri = await fetchImageAsDataUri(`http://127.0.0.1:${port}/frame.png`);
    await assert(dataUri.startsWith("data:image/png;base64,"), "fetched image becomes a base64 data URI with the right mime type");

    const { mediaType, base64 } = parseDataUri(dataUri);
    await assert(mediaType === "image/png", "parseDataUri extracts the media type");
    await assert(Buffer.from(base64, "base64").toString() === "fake-png-bytes-for-smoke-test", "round-tripped bytes match what the server sent");
  } finally {
    server.close();
  }

  const blocks = toContentBlocks("plain string content");
  await assert(
    blocks.length === 1 && blocks[0]!.type === "text" && (blocks[0] as { text: string }).text === "plain string content",
    "a plain string message normalizes to a single text content block",
  );

  // --- Video review schema ---
  const sampleReview = {
    overallSummary: "Solid first cut with strong shot variety.",
    overallScore: 7,
    storytelling: { score: 7, feedback: "Clear three-act structure." },
    composition: { score: 6, feedback: "Some shots are off-center without clear intent." },
    lighting: { score: 8, feedback: "Good use of practicals." },
    exposure: { score: 7, feedback: "Slightly underexposed in the interview segment." },
    whiteBalance: { score: 8, feedback: "Consistent across cuts." },
    audio: { score: 5, feedback: "Room tone is noticeable during dialogue." },
    editing: { score: 7, feedback: "Cuts are motivated, a few jump cuts feel accidental." },
    pacing: { score: 6, feedback: "Middle section runs long." },
    graphics: { score: 6, feedback: "Lower third font is hard to read." },
    professionalism: { score: 7, feedback: "Clean export, correct aspect ratio." },
    copyrightConcerns: [],
    accessibilityNotes: ["No captions were included."],
    nextSteps: ["Add captions", "Tighten the middle section by ~30 seconds"],
    analyzedVisualFrames: true,
  };
  const validated = videoReviewSchema.safeParse(sampleReview);
  await assert(validated.success, "a realistic AI Video Review payload validates against videoReviewSchema");

  console.log("\nAll Phase 6 smoke tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
