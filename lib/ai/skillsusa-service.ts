import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { skillsUsaBundleSchema, type SkillsUsaBundle } from "./schemas";

export interface GenerateSkillsUsaInput {
  contestName: string;
  organizationId: string;
  createdById: string;
  studentLevel?: string;
  notes?: string;
}

const SYSTEM_PROMPT = `You are the SkillsUSA Mode generator for Film Studio Classroom AI, helping a
teacher prepare students for a SkillsUSA competition in a video/broadcast/media contest area.
Given a contest name, produce a complete competition-practice package: a timed challenge (a
realistic scenario with a strict time limit matching how these contests are actually run — usually
under significant time pressure with unfamiliar constraints), a formative teacher rubric, a
competition-day judge scoring sheet, a mock competition schedule, and a bank of at least 3
additional practice scenarios in the same contest area (video production scenarios, broadcast
scenarios, or interview scenarios as appropriate to the contest).

Judge sheets and rubrics serve different purposes: the rubric is for formative coaching feedback,
the judge sheet is a point-based scoring instrument styled like what a real competition judge would
use, with clear numeric point values per criterion that sum to totalPossiblePoints.

Respond with ONLY a single JSON object matching the required schema. No prose, no markdown fences.`;

export async function generateSkillsUsaPractice(input: GenerateSkillsUsaInput) {
  const bundle = await requestBundle(input);
  return persistBundle(input, bundle);
}

async function requestBundle(input: GenerateSkillsUsaInput, attempt = 1): Promise<SkillsUsaBundle> {
  const provider = getAIProvider();

  const userPrompt = [
    `Contest: ${input.contestName}`,
    input.studentLevel ? `Student level: ${input.studentLevel}` : null,
    input.notes ? `Additional notes: ${input.notes}` : null,
    "",
    "Generate the complete SkillsUSA competition-practice package now as raw JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await provider.generate({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 4096,
    temperature: 0.6,
  });

  const parsed = safeParseJson(result.text);
  const validated = skillsUsaBundleSchema.safeParse(parsed);

  if (!validated.success) {
    if (attempt >= 3) {
      throw new Error(`SkillsUSA practice generation produced invalid output after ${attempt} attempts: ${validated.error.message}`);
    }
    return requestBundle(input, attempt + 1);
  }

  return validated.data;
}

function safeParseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    return {};
  }
}

async function persistBundle(input: GenerateSkillsUsaInput, bundle: SkillsUsaBundle) {
  return db.skillsUsaPractice.create({
    data: {
      organizationId: input.organizationId,
      createdById: input.createdById,
      contestName: bundle.contestName,
      competitionOverview: bundle.competitionOverview,
      timedChallenge: bundle.timedChallenge,
      rubric: bundle.rubric,
      judgeSheet: bundle.judgeSheet,
      mockCompetitionSchedule: bundle.mockCompetitionSchedule,
      scenarioBank: bundle.scenarioBank,
    },
  });
}
