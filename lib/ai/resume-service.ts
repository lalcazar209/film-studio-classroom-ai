import { z } from "zod";
import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { parseAIJson } from "./json-parsing";

export const resumeContentSchema = z.object({
  summary: z.string(),
  skills: z.array(z.string()).min(3),
  experience: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  education: z.string(),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;

const SYSTEM_PROMPT = `You write resumes for high school Film & TV Production students applying to
internships, college programs, or entry-level industry roles. Translate classroom project work
into professional, industry-credible resume language without exaggerating what a student did.
Respond with ONLY a single JSON object matching the required schema. No prose, no markdown fences.`;

/** Generates (or regenerates) the student's resume from their completed
 * project history and upserts it as a single PortfolioItem — a student has
 * one living resume, not a growing pile of snapshots. */
export async function generateResume(studentId: string) {
  const student = await db.user.findUniqueOrThrow({ where: { id: studentId } });

  const completedSubmissions = await db.submission.findMany({
    where: { studentId, status: { in: ["SUBMITTED", "REVIEWED", "GRADED"] } },
    include: { project: { include: { standards: { include: { standard: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  if (completedSubmissions.length === 0) {
    throw new Error("No completed projects yet — submit at least one project before generating a resume");
  }

  const projectSummaries = completedSubmissions
    .map((s) => `- ${s.project.title} (${s.project.category}): ${s.reflection ?? "no reflection provided"}`)
    .join("\n");

  const provider = getAIProvider();
  const result = await provider.generate({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Student name: ${student.name ?? "Student"}\n\nCompleted projects:\n${projectSummaries}\n\nGenerate the resume JSON now.`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.5,
  });

  const parsed = parseAIJson(result.text);
  const validated = resumeContentSchema.parse(parsed);

  const existing = await db.portfolioItem.findFirst({ where: { userId: studentId, type: "RESUME" } });

  if (existing) {
    return db.portfolioItem.update({
      where: { id: existing.id },
      data: { metadata: validated, title: `${student.name ?? "Student"} — Resume` },
    });
  }

  return db.portfolioItem.create({
    data: {
      userId: studentId,
      type: "RESUME",
      title: `${student.name ?? "Student"} — Resume`,
      metadata: validated,
    },
  });
}
