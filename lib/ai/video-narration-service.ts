import { db } from "@/lib/db";
import { getTTSProvider } from "./tts-registry";
import { uploadGeneratedAudio } from "@/lib/integrations/cloudinary";
import type { TutorialSegment } from "./schemas";

/** A tutorial segment once its narration has been synthesized into audio —
 * audioUrl/audioDurationSeconds are added post-generation, so they're kept
 * separate from tutorialSegmentSchema (which validates the AI's text
 * output only, before any audio exists). */
export type NarratedSegment = TutorialSegment & {
  audioUrl?: string;
  audioDurationSeconds?: number;
};

/** Pure merge of freshly-synthesized audio results into the existing
 * segment list, matched by array index. Exported and tested separately
 * from the network/DB orchestration below. */
export function mergeSegmentAudio(
  segments: TutorialSegment[],
  audioResults: { secureUrl: string; durationSeconds: number }[],
): NarratedSegment[] {
  return segments.map((segment, i) => ({
    ...segment,
    audioUrl: audioResults[i]?.secureUrl,
    audioDurationSeconds: audioResults[i]?.durationSeconds,
  }));
}

export async function generateTutorialNarration(tutorialId: string) {
  const tutorial = await db.tutorialVideo.findUniqueOrThrow({ where: { id: tutorialId } });
  const segments = tutorial.segments as unknown as TutorialSegment[];
  const provider = getTTSProvider();

  const audioResults = await Promise.all(
    segments.map(async (segment, i) => {
      const { base64, mediaType } = await provider.synthesizeSpeech({ text: segment.narration });
      return uploadGeneratedAudio({
        base64,
        mediaType,
        folder: `film-studio-classroom-ai/tutorial-narration/${tutorialId}`,
        publicId: `segment-${i}`,
      });
    }),
  );

  const narratedSegments = mergeSegmentAudio(segments, audioResults);

  return db.tutorialVideo.update({
    where: { id: tutorialId },
    data: {
      segments: narratedSegments as unknown as object,
      narrationGeneratedAt: new Date(),
    },
  });
}
