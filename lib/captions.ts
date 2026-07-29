import type { TutorialSegment } from "@/lib/ai/schemas";

/** Deterministic transforms from tutorial segments to transcript/captions —
 * these are computed, never AI-generated, so they can never drift out of
 * sync with the narration the AI actually wrote. */

export function segmentsToTranscript(segments: TutorialSegment[]): string {
  return segments.map((s) => s.narration).join("\n\n");
}

export function segmentsToSrt(segments: TutorialSegment[]): string {
  return segments
    .map((segment, index) => {
      const cue = index + 1;
      const start = formatSrtTimestamp(segment.startSeconds);
      const end = formatSrtTimestamp(segment.endSeconds);
      return `${cue}\n${start} --> ${end}\n${segment.narration}\n`;
    })
    .join("\n");
}

function formatSrtTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}
