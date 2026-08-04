import { describe, expect, it } from "vitest";
import { mergeSegmentAudio } from "@/lib/ai/video-narration-service";
import type { TutorialSegment } from "@/lib/ai/schemas";

const segments: TutorialSegment[] = [
  { startSeconds: 0, endSeconds: 10, narration: "First segment.", visualGuide: "Show the camera." },
  { startSeconds: 10, endSeconds: 20, narration: "Second segment.", visualGuide: "Show the lens." },
];

describe("mergeSegmentAudio", () => {
  it("attaches audioUrl and audioDurationSeconds to each segment by index", () => {
    const merged = mergeSegmentAudio(segments, [
      { secureUrl: "https://res.cloudinary.com/demo/video/upload/segment-0.mp3", durationSeconds: 4.2 },
      { secureUrl: "https://res.cloudinary.com/demo/video/upload/segment-1.mp3", durationSeconds: 5.1 },
    ]);

    expect(merged[0]?.audioUrl).toBe("https://res.cloudinary.com/demo/video/upload/segment-0.mp3");
    expect(merged[0]?.audioDurationSeconds).toBe(4.2);
    expect(merged[1]?.audioUrl).toBe("https://res.cloudinary.com/demo/video/upload/segment-1.mp3");
    expect(merged[0]?.narration).toBe("First segment.");
  });

  it("leaves audioUrl/audioDurationSeconds undefined for segments with no matching audio result", () => {
    const merged = mergeSegmentAudio(segments, [
      { secureUrl: "https://res.cloudinary.com/demo/video/upload/segment-0.mp3", durationSeconds: 4.2 },
    ]);

    expect(merged[0]?.audioUrl).toBeDefined();
    expect(merged[1]?.audioUrl).toBeUndefined();
    expect(merged[1]?.audioDurationSeconds).toBeUndefined();
  });
});
