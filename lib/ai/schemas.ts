import { z } from "zod";

/**
 * Shape of a fully generated Project bundle. This is the schema that makes
 * the platform an Educational Operating System rather than a lesson
 * planner: one generation call produces every downstream artifact at once.
 */

export const lessonDaySchema = z.enum([
  "MONDAY_LAUNCH",
  "TUESDAY_PREPRODUCTION",
  "WEDNESDAY_PRODUCTION",
  "THURSDAY_EDITING",
  "FRIDAY_SHOWCASE",
]);

export const agendaBlockSchema = z.object({
  label: z.string().describe("e.g. Hook, Direct Instruction, Guided Practice, Independent Work"),
  minutes: z.number().int().positive(),
  description: z.string(),
});

export const differentiationSchema = z.object({
  accommodations: z.array(z.string()),
  extensions: z.array(z.string()),
  interventions: z.array(z.string()),
});

export const lessonSchema = z.object({
  day: lessonDaySchema,
  title: z.string(),
  objective: z.string().describe("Teacher-facing learning objective"),
  iCanStatement: z.string().describe("Student-facing 'I can...' statement"),
  agenda: z.array(agendaBlockSchema).min(3),
  worksheet: z.object({
    title: z.string(),
    instructions: z.string(),
    sections: z.array(z.object({ heading: z.string(), prompts: z.array(z.string()) })),
  }),
  differentiation: differentiationSchema,
  standardCodes: z.array(z.string()).describe("Codes matched against the Standard table, e.g. 'A2.0'"),
});

export const rubricSchema = z.object({
  title: z.string(),
  criteria: z.array(
    z.object({
      name: z.string(),
      weightPercent: z.number().min(0).max(100),
      levels: z.array(
        z.object({
          label: z.string().describe("e.g. Exemplary, Proficient, Developing, Beginning"),
          points: z.number(),
          description: z.string(),
        }),
      ),
    }),
  ),
});

export const quizSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      prompt: z.string(),
      type: z.enum(["multiple_choice", "short_answer", "true_false"]),
      choices: z.array(z.string()).optional(),
      answer: z.string(),
      standardCode: z.string().optional(),
    }),
  ),
});

export const storyboardSchema = z.object({
  visualTheme: z.object({
    palette: z.array(z.string()),
    lighting: z.string(),
    lensCharacter: z.string(),
    aesthetic: z.string(),
  }),
  shots: z.array(
    z.object({
      number: z.number().int().positive(),
      description: z.string(),
      shotType: z.string(),
      movement: z.string(),
      lighting: z.string(),
      audio: z.string(),
      durationSec: z.number().positive(),
    }),
  ),
});

export const productionPlanSchema = z.object({
  callSheet: z.object({
    location: z.string(),
    callTime: z.string(),
    wrapTime: z.string(),
    notes: z.string(),
  }),
  crewRoles: z.array(z.object({ role: z.string(), responsibilities: z.string() })),
  equipmentList: z.array(z.object({ itemType: z.string(), quantity: z.number().int().positive() })),
  schedule: z.array(z.object({ time: z.string(), activity: z.string() })),
});

export const projectBundleSchema = z.object({
  title: z.string(),
  teacherGuideSummary: z.string(),
  studentGuideSummary: z.string(),
  vocabulary: z.array(z.object({ term: z.string(), definition: z.string() })).min(5),
  lessons: z.array(lessonSchema).length(5),
  rubric: rubricSchema,
  quiz: quizSchema,
  storyboard: storyboardSchema,
  productionPlan: productionPlanSchema,
});

export type ProjectBundle = z.infer<typeof projectBundleSchema>;

const reviewCategorySchema = z.object({
  score: z.number().min(1).max(10),
  feedback: z.string(),
});

export const videoReviewSchema = z.object({
  overallSummary: z.string(),
  overallScore: z.number().min(1).max(10),
  storytelling: reviewCategorySchema,
  composition: reviewCategorySchema,
  lighting: reviewCategorySchema,
  exposure: reviewCategorySchema,
  whiteBalance: reviewCategorySchema,
  audio: reviewCategorySchema,
  editing: reviewCategorySchema,
  pacing: reviewCategorySchema,
  graphics: reviewCategorySchema,
  professionalism: reviewCategorySchema,
  copyrightConcerns: z.array(z.string()),
  accessibilityNotes: z.array(z.string()),
  nextSteps: z.array(z.string()).min(1),
  /** True when the review was based on actual extracted video frames vs.
   * text-only metadata (no video file was uploaded through Cloudinary). */
  analyzedVisualFrames: z.boolean(),
});

export type VideoReview = z.infer<typeof videoReviewSchema>;

export const tutorialSegmentSchema = z
  .object({
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().positive(),
    narration: z.string().describe("Voiceover script for this segment"),
    visualGuide: z.string().describe("What should be on screen during this segment"),
    shotType: z.string().optional(),
    graphicsNote: z.string().optional(),
    animationSuggestion: z.string().optional(),
  })
  .refine((segment) => segment.endSeconds > segment.startSeconds, {
    message: "endSeconds must be after startSeconds",
    path: ["endSeconds"],
  });

export const tutorialVideoBundleSchema = z.object({
  title: z.string(),
  topic: z.string(),
  learningObjective: z.string(),
  teacherScript: z.string().describe("Talking points for a teacher presenting this live instead of playing a video"),
  segments: z.array(tutorialSegmentSchema).min(3),
  practiceActivity: z.object({
    title: z.string(),
    instructions: z.string(),
    estimatedMinutes: z.number().int().positive(),
  }),
  quiz: quizSchema,
});

export type TutorialSegment = z.infer<typeof tutorialSegmentSchema>;
export type TutorialVideoBundle = z.infer<typeof tutorialVideoBundleSchema>;
