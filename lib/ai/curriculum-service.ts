import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { projectBundleSchema, type ProjectBundle } from "./schemas";
import { dispatchWebhookEvent } from "@/lib/integrations/webhooks";
import type { Prisma, ProjectCategory } from "@prisma/client";

export interface GenerateProjectInput {
  title: string;
  category: ProjectCategory;
  gradeLevel: string;
  classPeriodId: string;
  requestedById: string;
  /** Free-text brief from the teacher, e.g. "30-second PSA about recycling for freshmen" */
  brief: string;
  /** Standard codes the teacher wants prioritized; the model may add more. */
  targetStandardCodes?: string[];
}

const SYSTEM_PROMPT = `You are the AI Curriculum Builder for Film Studio Classroom AI, an
Educational Operating System for Film & Television Production classes (grades 9-12,
adult ed, college). You generate one complete Project-Based-Learning week at a time,
following the fixed weekly cycle:

- MONDAY_LAUNCH: project launch, hook, industry connection, career focus, safety, team assignment
- TUESDAY_PREPRODUCTION: brainstorming, research, storyboarding, script/shot list, crew roles
- WEDNESDAY_PRODUCTION: filming day (lighting, audio, directing, on set roles)
- THURSDAY_EDITING: editing day (software workflow, color, audio mix, export)
- FRIDAY_SHOWCASE: student showcase, peer review, reflection, rubric-based feedback

Every lesson must include a teacher-facing objective AND a student-facing "I can..."
statement, a differentiation plan (accommodations, extensions, interventions), and be
aligned to real California CTE Arts Media & Entertainment standards, California VAPA
Media Arts standards, or ISTE standards (use plausible, correctly-formatted codes).

Respond with ONLY a single JSON object matching the required schema. No prose, no
markdown fences.`;

export async function generateProjectBundle(
  input: GenerateProjectInput,
): Promise<{ project: Awaited<ReturnType<typeof persistBundle>>; bundle: ProjectBundle }> {
  const job = await db.aIGenerationJob.create({
    data: {
      requestedById: input.requestedById,
      status: "RUNNING",
      input: input as unknown as object,
      startedAt: new Date(),
    },
  });

  try {
    const bundle = await requestBundle(input);

    const project = await persistBundle(input, bundle);

    await db.aIGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        output: bundle as unknown as object,
        finishedAt: new Date(),
        projectId: project.id,
      },
    });

    const classPeriod = await db.classPeriod.findUnique({
      where: { id: input.classPeriodId },
      select: { organizationId: true },
    });
    if (classPeriod) {
      await dispatchWebhookEvent(classPeriod.organizationId, {
        type: "project.generated",
        summary: `New project generated: "${project.title}"`,
        payload: { projectId: project.id, category: input.category },
      });
    }

    return { project, bundle };
  } catch (error) {
    await db.aIGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      },
    });
    throw error;
  }
}

async function requestBundle(input: GenerateProjectInput, attempt = 1): Promise<ProjectBundle> {
  const provider = getAIProvider();

  const userPrompt = [
    `Project title: ${input.title}`,
    `Category: ${input.category}`,
    `Grade level: ${input.gradeLevel}`,
    `Teacher brief: ${input.brief}`,
    input.targetStandardCodes?.length
      ? `Prioritize these standard codes if applicable: ${input.targetStandardCodes.join(", ")}`
      : null,
    "",
    "Generate the complete five-day project bundle now as raw JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await provider.generate({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 8192,
    temperature: 0.6,
  });

  const parsed = safeParseJson(result.text);
  const validated = projectBundleSchema.safeParse(parsed);

  if (!validated.success) {
    if (attempt >= 3) {
      throw new Error(
        `AI curriculum generation produced invalid output after ${attempt} attempts: ${validated.error.message}`,
      );
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

async function persistBundle(input: GenerateProjectInput, bundle: ProjectBundle) {
  return db.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        title: bundle.title,
        category: input.category,
        status: "READY",
        classPeriodId: input.classPeriodId,
        brief: input.brief,
      },
    });

    await tx.vocabularyTerm.createMany({
      data: bundle.vocabulary.map((v) => ({
        projectId: project.id,
        term: v.term,
        definition: v.definition,
      })),
    });

    for (const lesson of bundle.lessons) {
      const createdLesson = await tx.lesson.create({
        data: {
          projectId: project.id,
          day: lesson.day,
          title: lesson.title,
          objective: lesson.objective,
          iCanStatement: lesson.iCanStatement,
          agenda: lesson.agenda,
          worksheet: lesson.worksheet,
          differentiation: lesson.differentiation,
        },
      });

      const standards = await resolveStandards(tx, lesson.standardCodes);
      if (standards.length) {
        await tx.lessonStandard.createMany({
          data: standards.map((s) => ({ lessonId: createdLesson.id, standardId: s.id })),
          skipDuplicates: true,
        });
        await tx.projectStandard.createMany({
          data: standards.map((s) => ({ projectId: project.id, standardId: s.id })),
          skipDuplicates: true,
        });
      }
    }

    await tx.rubric.create({
      data: { projectId: project.id, title: bundle.rubric.title, criteria: bundle.rubric.criteria },
    });

    await tx.quiz.create({
      data: { projectId: project.id, title: bundle.quiz.title, questions: bundle.quiz.questions },
    });

    await tx.storyboard.create({
      data: {
        projectId: project.id,
        visualTheme: bundle.storyboard.visualTheme,
        shots: bundle.storyboard.shots,
      },
    });

    await tx.productionPlan.create({
      data: {
        projectId: project.id,
        callSheet: bundle.productionPlan.callSheet,
        crewRoles: bundle.productionPlan.crewRoles,
        equipmentList: bundle.productionPlan.equipmentList,
        schedule: bundle.productionPlan.schedule,
      },
    });

    // A Submission row per enrolled student means the gradebook has
    // something to show from the moment a project is generated, not just
    // after a student turns work in.
    const enrolledStudents = await tx.enrollment.findMany({
      where: { classPeriodId: input.classPeriodId },
      select: { studentId: true },
    });
    if (enrolledStudents.length) {
      await tx.submission.createMany({
        data: enrolledStudents.map((e) => ({ projectId: project.id, studentId: e.studentId })),
        skipDuplicates: true,
      });
    }

    return tx.project.findUniqueOrThrow({
      where: { id: project.id },
      include: {
        lessons: { include: { standards: { include: { standard: true } } } },
        rubric: true,
        quiz: true,
        vocabulary: true,
        storyboard: true,
        productionPlan: true,
        standards: { include: { standard: true } },
      },
    });
  });
}

/** Standard codes the model invents that don't yet exist locally are
 * created as CA_CTE_AME entries so the standards library grows over time
 * rather than silently dropping alignment data. */
async function resolveStandards(tx: Prisma.TransactionClient, codes: string[]) {
  if (!codes.length) return [];

  const existing = await tx.standard.findMany({ where: { code: { in: codes } } });
  const existingCodes = new Set(existing.map((s) => s.code));
  const missing = codes.filter((c) => !existingCodes.has(c));

  if (missing.length) {
    await tx.standard.createMany({
      data: missing.map((code) => ({
        framework: "CA_CTE_AME" as const,
        code,
        description: "Auto-registered by AI Curriculum Builder — pending review.",
      })),
      skipDuplicates: true,
    });
  }

  return tx.standard.findMany({ where: { code: { in: codes } } });
}
