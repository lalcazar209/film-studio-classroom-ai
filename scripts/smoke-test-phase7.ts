/**
 * Covers the deterministic parts of Phase 7: transcript/SRT-caption
 * generation from tutorial segments (pure functions, no AI or DB
 * involved) and the tutorial bundle schema. The AI generation call
 * itself needs a real ANTHROPIC_API_KEY, consistent with prior phases.
 */
import { segmentsToTranscript, segmentsToSrt } from "../lib/captions";
import { tutorialVideoBundleSchema, tutorialSegmentSchema } from "../lib/ai/schemas";

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  const segments = [
    { startSeconds: 0, endSeconds: 5.5, narration: "Let's talk about three-point lighting.", visualGuide: "Title card" },
    { startSeconds: 5.5, endSeconds: 12, narration: "Start with your key light at 45 degrees.", visualGuide: "Diagram of key light placement" },
    { startSeconds: 12, endSeconds: 20.25, narration: "Add a fill light to soften shadows.", visualGuide: "Before/after fill light comparison" },
  ];

  // --- Transcript ---
  const transcript = segmentsToTranscript(segments);
  await assert(
    transcript === segments.map((s) => s.narration).join("\n\n"),
    "transcript joins segment narration with blank lines between them",
  );

  // --- SRT captions ---
  const srt = segmentsToSrt(segments);
  await assert(srt.includes("1\n00:00:00,000 --> 00:00:05,500\n"), "first cue has correct SRT timestamp format including milliseconds");
  await assert(srt.includes("2\n00:00:05,500 --> 00:00:12,000\n"), "second cue starts exactly where the first ends");
  await assert(srt.includes("3\n00:00:12,000 --> 00:00:20,250\n"), "third cue timestamp formats sub-second precision correctly");
  await assert(
    srt.split("\n").filter((line) => /^\d+$/.test(line.trim()) && Number(line.trim()) <= 3).length === 3,
    "SRT has one numbered cue per segment",
  );

  // A tutorial with an hour+ of runtime should still format hours correctly.
  const longSrt = segmentsToSrt([{ startSeconds: 3661, endSeconds: 3665, narration: "x", visualGuide: "y" }]);
  await assert(longSrt.includes("01:01:01,000 --> 01:01:05,000"), "timestamps beyond an hour format the hours field correctly");

  // --- Schema validation ---
  const badSegment = tutorialSegmentSchema.safeParse({
    startSeconds: 10,
    endSeconds: 5,
    narration: "x",
    visualGuide: "y",
  });
  await assert(!badSegment.success, "a segment where endSeconds is before startSeconds is rejected");

  const sampleBundle = {
    title: "Three-Point Lighting Basics",
    topic: "Three-point lighting",
    learningObjective: "Students will be able to set up a basic three-point lighting rig.",
    teacherScript: "Today we're covering key, fill, and back light...",
    segments,
    practiceActivity: {
      title: "Light your desk",
      instructions: "Set up a key and fill light for a tabletop subject.",
      estimatedMinutes: 15,
    },
    quiz: {
      title: "Lighting check",
      questions: [
        { prompt: "What is the purpose of a fill light?", type: "short_answer" as const, answer: "To soften shadows from the key light." },
      ],
    },
  };
  const validatedBundle = tutorialVideoBundleSchema.safeParse(sampleBundle);
  await assert(validatedBundle.success, "a realistic tutorial bundle validates against tutorialVideoBundleSchema");

  console.log("\nAll Phase 7 smoke tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
