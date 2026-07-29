/**
 * Covers the deterministic parts of Phase 9: the SkillsUSA bundle schema
 * and a real DB round-trip persisting/reading a SkillsUsaPractice. The AI
 * generation call itself needs a real ANTHROPIC_API_KEY, consistent with
 * prior phases.
 */
import { PrismaClient } from "@prisma/client";
import { skillsUsaBundleSchema } from "../lib/ai/schemas";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  const sampleBundle = {
    contestName: "Broadcast News Production",
    competitionOverview: "Teams produce a 3-5 minute newscast segment from provided footage and a breaking prompt.",
    timedChallenge: {
      title: "Breaking News Rewrite",
      scenario: "You're handed a wire report 30 minutes before air and must build a segment around it.",
      timeLimitMinutes: 45,
      deliverable: "A finished 90-second news package with a recorded voiceover.",
      constraints: ["Only footage provided may be used", "No internet access during the challenge"],
    },
    rubric: {
      title: "Broadcast News Formative Rubric",
      criteria: [
        {
          name: "Writing quality",
          weightPercent: 30,
          levels: [{ label: "Proficient", points: 3, description: "Broadcast-style, active voice, concise." }],
        },
        {
          name: "Delivery",
          weightPercent: 30,
          levels: [{ label: "Proficient", points: 3, description: "Confident pacing and eye contact." }],
        },
        {
          name: "Technical execution",
          weightPercent: 40,
          levels: [{ label: "Proficient", points: 3, description: "Clean audio, correct export." }],
        },
      ],
    },
    judgeSheet: {
      criteria: [
        { name: "Writing quality", maxPoints: 30, guidance: "Deduct for passive voice or unclear leads." },
        { name: "Delivery", maxPoints: 30, guidance: "Deduct for reading off-script or monotone delivery." },
        { name: "Technical execution", maxPoints: 40, guidance: "Deduct for audio issues or missed deadline." },
      ],
      totalPossiblePoints: 100,
    },
    mockCompetitionSchedule: [
      { time: "8:00", activity: "Check-in and equipment check" },
      { time: "8:15", activity: "Challenge briefing" },
      { time: "8:30", activity: "45-minute timed challenge" },
      { time: "9:15", activity: "Submission and judging" },
    ],
    scenarioBank: [
      { title: "Weather emergency", prompt: "Cover a sudden weather emergency with limited b-roll." },
      { title: "School board vote", prompt: "Summarize a local school board vote for a general audience." },
      { title: "Sports upset", prompt: "Cover an unexpected sports upset with post-game reactions." },
    ],
  };

  const validated = skillsUsaBundleSchema.safeParse(sampleBundle);
  await assert(validated.success, "a realistic SkillsUSA bundle validates against skillsUsaBundleSchema");

  const missingScenario = { ...sampleBundle, scenarioBank: sampleBundle.scenarioBank.slice(0, 1) };
  const tooFewScenarios = skillsUsaBundleSchema.safeParse(missingScenario);
  await assert(!tooFewScenarios.success, "a bundle with fewer than 3 practice scenarios is rejected");

  const zeroTimeLimit = { ...sampleBundle, timedChallenge: { ...sampleBundle.timedChallenge, timeLimitMinutes: 0 } };
  const rejectedZeroTime = skillsUsaBundleSchema.safeParse(zeroTimeLimit);
  await assert(!rejectedZeroTime.success, "a timed challenge with zero (non-positive) time limit is rejected");

  // --- Real DB round trip ---
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  const teacher = await db.user.findUniqueOrThrow({ where: { email: "teacher@demo.filmstudioclassroom.ai" } });

  const created = await db.skillsUsaPractice.create({
    data: {
      organizationId: org.id,
      createdById: teacher.id,
      contestName: sampleBundle.contestName,
      competitionOverview: sampleBundle.competitionOverview,
      timedChallenge: sampleBundle.timedChallenge,
      rubric: sampleBundle.rubric,
      judgeSheet: sampleBundle.judgeSheet,
      mockCompetitionSchedule: sampleBundle.mockCompetitionSchedule,
      scenarioBank: sampleBundle.scenarioBank,
    },
  });

  const fetched = await db.skillsUsaPractice.findUniqueOrThrow({ where: { id: created.id } });
  await assert(fetched.contestName === "Broadcast News Production", "persisted practice round-trips correctly from Postgres");
  await assert(
    (fetched.judgeSheet as { totalPossiblePoints: number }).totalPossiblePoints === 100,
    "nested JSON fields (judge sheet total points) survive the round trip",
  );

  await db.skillsUsaPractice.delete({ where: { id: created.id } });

  console.log("\nAll Phase 9 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
