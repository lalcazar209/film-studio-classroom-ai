import { db } from "@/lib/db";
import { z } from "zod";

export class DemoReelError extends Error {}

export const demoReelClipSchema = z.object({
  submissionId: z.string().cuid(),
  title: z.string(),
  videoUrl: z.string().url(),
});

export type DemoReelClip = z.infer<typeof demoReelClipSchema>;

/** A demo reel is a curated, ordered playlist of a student's own submitted
 * work — not video processing/concatenation (that's outside this app's
 * scope), just picking the best clips and the order to show them in. One
 * living reel per student, same upsert pattern as the resume. */
export async function saveDemoReel(studentId: string, title: string, clips: DemoReelClip[]) {
  const submissionIds = clips.map((c) => c.submissionId);
  const ownedSubmissions = await db.submission.findMany({
    where: { id: { in: submissionIds }, studentId },
    select: { id: true },
  });
  const ownedIds = new Set(ownedSubmissions.map((s) => s.id));

  if (clips.some((c) => !ownedIds.has(c.submissionId))) {
    throw new DemoReelError("One or more selected clips are not your own submissions");
  }

  const existing = await db.portfolioItem.findFirst({ where: { userId: studentId, type: "DEMO_REEL" } });
  const data = { title, metadata: { clips }, assetUrl: clips[0]?.videoUrl };

  if (existing) {
    return db.portfolioItem.update({ where: { id: existing.id }, data });
  }

  return db.portfolioItem.create({ data: { userId: studentId, type: "DEMO_REEL", ...data } });
}
