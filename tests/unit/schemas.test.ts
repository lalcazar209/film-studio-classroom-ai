import { describe, expect, it } from "vitest";
import {
  projectBundleSchema,
  videoReviewSchema,
  tutorialVideoBundleSchema,
  tutorialSegmentSchema,
  filmStudioBundleSchema,
  skillsUsaBundleSchema,
} from "@/lib/ai/schemas";

const validLesson = {
  day: "MONDAY_LAUNCH",
  title: "Launch Day",
  objective: "Students will understand the assignment.",
  iCanStatement: "I can explain the project goal.",
  agenda: [
    { label: "Hook", minutes: 5, description: "Watch a sample." },
    { label: "Direct Instruction", minutes: 15, description: "Model the skill." },
    { label: "Independent Work", minutes: 20, description: "Students practice." },
  ],
  worksheet: { title: "Worksheet", instructions: "Fill it out.", sections: [] },
  differentiation: { accommodations: ["Extra time"], extensions: ["Twist ending"], interventions: ["1:1 check-in"] },
  standardCodes: ["F1.0"],
};

function projectBundle(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Test Project",
    teacherGuideSummary: "Summary",
    studentGuideSummary: "Summary",
    vocabulary: Array.from({ length: 5 }, (_, i) => ({ term: `term${i}`, definition: `def${i}` })),
    lessons: [
      { ...validLesson, day: "MONDAY_LAUNCH" },
      { ...validLesson, day: "TUESDAY_PREPRODUCTION" },
      { ...validLesson, day: "WEDNESDAY_PRODUCTION" },
      { ...validLesson, day: "THURSDAY_EDITING" },
      { ...validLesson, day: "FRIDAY_SHOWCASE" },
    ],
    rubric: { title: "Rubric", criteria: [{ name: "x", weightPercent: 100, levels: [{ label: "Proficient", points: 3, description: "d" }] }] },
    quiz: { title: "Quiz", questions: [{ prompt: "p", type: "short_answer", answer: "a" }] },
    storyboard: { visualTheme: { palette: ["#fff"], lighting: "soft", lensCharacter: "wide", aesthetic: "clean" }, shots: [{ number: 1, description: "d", shotType: "wide", movement: "static", lighting: "soft", audio: "vo", durationSec: 5 }] },
    productionPlan: {
      callSheet: { location: "Studio", callTime: "8:00", wrapTime: "12:00", notes: "n" },
      crewRoles: [{ role: "Director", responsibilities: "r" }],
      equipmentList: [{ itemType: "Camera", quantity: 1 }],
      schedule: [{ time: "8:00", activity: "Setup" }],
    },
    ...overrides,
  };
}

describe("projectBundleSchema", () => {
  it("validates a complete, realistic bundle", () => {
    expect(projectBundleSchema.safeParse(projectBundle()).success).toBe(true);
  });

  it("rejects a bundle with fewer than 5 lessons", () => {
    const bad = projectBundle({ lessons: [validLesson] });
    expect(projectBundleSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a bundle with fewer than 5 vocabulary terms", () => {
    const bad = projectBundle({ vocabulary: [{ term: "x", definition: "y" }] });
    expect(projectBundleSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a lesson with an invalid day enum value", () => {
    const bad = projectBundle({ lessons: [{ ...validLesson, day: "SUNDAY" }] });
    expect(projectBundleSchema.safeParse(bad).success).toBe(false);
  });
});

describe("videoReviewSchema", () => {
  const category = { score: 7, feedback: "Solid." };
  const review = {
    overallSummary: "Good first cut.",
    overallScore: 7,
    storytelling: category,
    composition: category,
    lighting: category,
    exposure: category,
    whiteBalance: category,
    audio: category,
    editing: category,
    pacing: category,
    graphics: category,
    professionalism: category,
    copyrightConcerns: [],
    accessibilityNotes: ["No captions."],
    nextSteps: ["Add captions."],
    analyzedVisualFrames: true,
  };

  it("validates a complete review", () => {
    expect(videoReviewSchema.safeParse(review).success).toBe(true);
  });

  it("rejects a score outside the 1-10 range", () => {
    expect(videoReviewSchema.safeParse({ ...review, overallScore: 11 }).success).toBe(false);
  });

  it("rejects a review with an empty nextSteps array", () => {
    expect(videoReviewSchema.safeParse({ ...review, nextSteps: [] }).success).toBe(false);
  });
});

describe("tutorialSegmentSchema", () => {
  it("rejects a segment where endSeconds is before startSeconds", () => {
    const result = tutorialSegmentSchema.safeParse({
      startSeconds: 10,
      endSeconds: 5,
      narration: "x",
      visualGuide: "y",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a segment with a positive duration", () => {
    const result = tutorialSegmentSchema.safeParse({
      startSeconds: 0,
      endSeconds: 5,
      narration: "x",
      visualGuide: "y",
    });
    expect(result.success).toBe(true);
  });
});

describe("tutorialVideoBundleSchema", () => {
  it("rejects a bundle with fewer than 3 segments", () => {
    const bundle = {
      title: "t",
      topic: "t",
      learningObjective: "o",
      teacherScript: "s",
      segments: [{ startSeconds: 0, endSeconds: 5, narration: "n", visualGuide: "v" }],
      practiceActivity: { title: "t", instructions: "i", estimatedMinutes: 5 },
      quiz: { title: "q", questions: [{ prompt: "p", type: "short_answer", answer: "a" }] },
    };
    expect(tutorialVideoBundleSchema.safeParse(bundle).success).toBe(false);
  });
});

describe("filmStudioBundleSchema", () => {
  it("validates a complete production package", () => {
    const bundle = {
      title: "Corner Store",
      logline: "A family fights to keep their store open.",
      genre: "Documentary",
      screenplay: { scenes: [{ sceneNumber: 1, heading: "INT. STORE - DAY", action: "a", dialogue: [] }] },
      shotList: { shots: [{ number: 1, sceneNumber: 1, description: "d", shotType: "wide", lens: "24mm", movement: "static", durationSeconds: 5 }] },
      callSheet: { shootDate: "2026-01-01", generalCallTime: "8:00", location: "Store", cast: [], crew: [], notes: "n" },
      budget: { lineItems: [], totalEstimate: 0 },
      equipmentList: [{ itemType: "Camera", quantity: 1 }],
      locationPlan: [{ name: "Store", notes: "n", permitsNeeded: false }],
      castingSheet: [{ character: "Owner", description: "d" }],
      marketingPlan: { targetAudience: "a", keyMessages: ["m"], channels: ["YouTube"], posterConcept: "p", trailerConcept: "t" },
    };
    expect(filmStudioBundleSchema.safeParse(bundle).success).toBe(true);
  });
});

describe("skillsUsaBundleSchema", () => {
  const base = {
    contestName: "Broadcast News Production",
    competitionOverview: "o",
    timedChallenge: { title: "t", scenario: "s", timeLimitMinutes: 45, deliverable: "d", constraints: [] },
    rubric: { title: "r", criteria: [{ name: "n", weightPercent: 100, levels: [] }] },
    judgeSheet: { criteria: [{ name: "n", maxPoints: 100, guidance: "g" }], totalPossiblePoints: 100 },
    mockCompetitionSchedule: [{ time: "8:00", activity: "Check-in" }],
    scenarioBank: [
      { title: "a", prompt: "p" },
      { title: "b", prompt: "p" },
      { title: "c", prompt: "p" },
    ],
  };

  it("validates a complete practice package", () => {
    expect(skillsUsaBundleSchema.safeParse(base).success).toBe(true);
  });

  it("rejects fewer than 3 practice scenarios", () => {
    expect(skillsUsaBundleSchema.safeParse({ ...base, scenarioBank: base.scenarioBank.slice(0, 1) }).success).toBe(false);
  });

  it("rejects a non-positive time limit", () => {
    expect(
      skillsUsaBundleSchema.safeParse({ ...base, timedChallenge: { ...base.timedChallenge, timeLimitMinutes: 0 } }).success,
    ).toBe(false);
  });
});
