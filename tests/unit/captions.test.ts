import { describe, expect, it } from "vitest";
import { segmentsToTranscript, segmentsToSrt } from "@/lib/captions";
import type { TutorialSegment } from "@/lib/ai/schemas";

const segments: TutorialSegment[] = [
  { startSeconds: 0, endSeconds: 5.5, narration: "Let's talk about three-point lighting.", visualGuide: "Title card" },
  { startSeconds: 5.5, endSeconds: 12, narration: "Start with your key light at 45 degrees.", visualGuide: "Diagram" },
  { startSeconds: 12, endSeconds: 20.25, narration: "Add a fill light to soften shadows.", visualGuide: "Comparison" },
];

describe("segmentsToTranscript", () => {
  it("joins segment narration with blank lines between them", () => {
    expect(segmentsToTranscript(segments)).toBe(segments.map((s) => s.narration).join("\n\n"));
  });
});

describe("segmentsToSrt", () => {
  it("formats the first cue with correct SRT timestamp syntax including milliseconds", () => {
    expect(segmentsToSrt(segments)).toContain("1\n00:00:00,000 --> 00:00:05,500\n");
  });

  it("chains cues so each one starts exactly where the previous ends", () => {
    expect(segmentsToSrt(segments)).toContain("2\n00:00:05,500 --> 00:00:12,000\n");
  });

  it("formats sub-second precision correctly", () => {
    expect(segmentsToSrt(segments)).toContain("3\n00:00:12,000 --> 00:00:20,250\n");
  });

  it("formats timestamps beyond an hour with the hours field correct", () => {
    const long = segmentsToSrt([{ startSeconds: 3661, endSeconds: 3665, narration: "x", visualGuide: "y" }]);
    expect(long).toContain("01:01:01,000 --> 01:01:05,000");
  });

  it("produces exactly one numbered cue per segment", () => {
    const cueNumbers = segmentsToSrt(segments)
      .split("\n")
      .filter((line) => /^\d+$/.test(line.trim()));
    expect(cueNumbers).toHaveLength(3);
  });
});
