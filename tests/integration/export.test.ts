import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { renderProjectPdf } from "@/lib/export/project-pdf";
import { renderProjectDocx } from "@/lib/export/project-docx";
import { renderProjectPptx } from "@/lib/export/project-pptx";
import { buildProjectOutline, buildTutorialOutline } from "@/lib/export/gamma";
import { buildProjectDocContent } from "@/lib/export/google-docs";

const db = new PrismaClient();
let projectId: string;

beforeAll(async () => {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });
  const project = await db.project.create({
    data: { title: "Vitest Export Project", category: "PSA", status: "READY", classPeriodId: classPeriod.id, brief: "Exercise every export format." },
  });
  await db.lesson.create({
    data: {
      projectId: project.id,
      day: "MONDAY_LAUNCH",
      title: "Launch Day",
      objective: "Students will understand the assignment.",
      iCanStatement: "I can explain the project goal.",
      agenda: [{ label: "Hook", minutes: 5, description: "Watch a sample PSA." }],
      worksheet: { title: "Launch worksheet", instructions: "Fill it out.", sections: [] },
      differentiation: { accommodations: ["Extra time"], extensions: ["Twist ending"], interventions: ["1:1 check-in"] },
    },
  });
  await db.rubric.create({ data: { projectId: project.id, title: "PSA Rubric", criteria: [{ name: "Clarity", weightPercent: 100, levels: [] }] } });
  await db.quiz.create({ data: { projectId: project.id, title: "PSA Quiz", questions: [{ prompt: "What is a PSA?", type: "short_answer", answer: "Public service announcement" }] } });
  await db.vocabularyTerm.create({ data: { projectId: project.id, term: "PSA", definition: "Public service announcement" } });
  projectId = project.id;
});

afterAll(async () => {
  await db.project.delete({ where: { id: projectId } });
  await db.$disconnect();
});

async function loadFullProject() {
  return db.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      classPeriod: true,
      lessons: { include: { standards: { include: { standard: true } } } },
      rubric: true,
      quiz: true,
      vocabulary: true,
    },
  });
}

describe("renderProjectPdf", () => {
  it("produces a real PDF file (starts with the %PDF- magic bytes) of substantial size", async () => {
    const project = await loadFullProject();
    const buffer = await renderProjectPdf(project);
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe("renderProjectDocx", () => {
  it("produces a real ZIP-based OOXML file (starts with the PK signature)", async () => {
    const project = await loadFullProject();
    const buffer = await renderProjectDocx(project);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe("renderProjectPptx", () => {
  it("produces a real ZIP-based OOXML file (starts with the PK signature)", async () => {
    const project = await loadFullProject();
    const buffer = await renderProjectPptx(project);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe("outline/content builders", () => {
  it("buildProjectOutline includes the brief and every lesson title", async () => {
    const project = await loadFullProject();
    const outline = buildProjectOutline({
      title: project.title,
      brief: project.brief,
      lessons: project.lessons.map((l) => ({ dayLabel: l.day, title: l.title, objective: l.objective })),
    });
    expect(outline).toContain(project.brief);
    expect(outline).toContain("Launch Day");
  });

  it("buildTutorialOutline includes every segment's narration in order", () => {
    const outline = buildTutorialOutline({
      learningObjective: "Learn lighting.",
      segments: [{ narration: "First." }, { narration: "Second." }],
    });
    expect(outline.indexOf("First.")).toBeLessThan(outline.indexOf("Second."));
  });

  it("buildProjectDocContent includes the class period name and each I-can statement", async () => {
    const project = await loadFullProject();
    const content = buildProjectDocContent({
      title: project.title,
      classPeriodName: project.classPeriod.name,
      brief: project.brief,
      lessons: project.lessons.map((l) => ({ dayLabel: l.day, title: l.title, objective: l.objective, iCanStatement: l.iCanStatement })),
    });
    expect(content).toContain(project.classPeriod.name);
    expect(content).toContain("I can: I can explain the project goal.");
  });
});
