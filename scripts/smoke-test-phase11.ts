/**
 * Covers the deterministic parts of Phase 11: PDF/Docx/PPTX generation
 * need no external API, so these are verified by actually rendering real
 * files against real seeded data and checking their byte structure (not
 * just "did it not throw"). Gamma and Google Docs export need live
 * credentials and aren't exercised here, consistent with prior phases;
 * buildProjectOutline/buildTutorialOutline (the deterministic text-shaping
 * helpers feeding Gamma) are checked directly instead.
 */
import { PrismaClient } from "@prisma/client";
import { renderProjectPdf } from "../lib/export/project-pdf";
import { renderProjectDocx } from "../lib/export/project-docx";
import { renderProjectPptx } from "../lib/export/project-pptx";
import { buildProjectOutline, buildTutorialOutline } from "../lib/export/gamma";
import { buildProjectDocContent } from "../lib/export/google-docs";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  // Build a real project with all export-relevant relations using the
  // demo org's seeded class period, so this exercises the exact query
  // shape the export routes use.
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });

  const project = await db.project.create({
    data: {
      title: "Export Smoke Test Project",
      category: "PSA",
      status: "READY",
      classPeriodId: classPeriod.id,
      brief: "A test project to exercise every export format.",
    },
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
      differentiation: { accommodations: ["Extra time"], extensions: ["Add a twist ending"], interventions: ["1:1 check-in"] },
    },
  });
  await db.rubric.create({
    data: { projectId: project.id, title: "PSA Rubric", criteria: [{ name: "Message clarity", weightPercent: 100, levels: [] }] },
  });
  await db.quiz.create({
    data: { projectId: project.id, title: "PSA Quiz", questions: [{ prompt: "What is a PSA?", type: "short_answer", answer: "Public service announcement" }] },
  });
  await db.vocabularyTerm.create({ data: { projectId: project.id, term: "PSA", definition: "Public service announcement" } });

  const fullProject = await db.project.findUniqueOrThrow({
    where: { id: project.id },
    include: {
      classPeriod: true,
      lessons: { include: { standards: { include: { standard: true } } } },
      rubric: true,
      quiz: true,
      vocabulary: true,
    },
  });

  // --- PDF ---
  const pdfBuffer = await renderProjectPdf(fullProject);
  await assert(pdfBuffer.subarray(0, 5).toString("latin1") === "%PDF-", "generated PDF starts with the %PDF- magic bytes");
  await assert(pdfBuffer.length > 1000, "generated PDF is a substantial file, not an empty/truncated stub");

  // --- Docx ---
  const docxBuffer = await renderProjectDocx(fullProject);
  // .docx is a ZIP container; ZIP files start with "PK".
  await assert(docxBuffer.subarray(0, 2).toString("latin1") === "PK", "generated .docx is a real ZIP-based OOXML file (starts with PK)");
  await assert(docxBuffer.length > 1000, "generated .docx is a substantial file, not an empty/truncated stub");

  // --- Pptx ---
  const pptxBuffer = await renderProjectPptx(fullProject);
  await assert(pptxBuffer.subarray(0, 2).toString("latin1") === "PK", "generated .pptx is a real ZIP-based OOXML file (starts with PK)");
  await assert(pptxBuffer.length > 1000, "generated .pptx is a substantial file, not an empty/truncated stub");

  // --- Gamma outline builders (deterministic text shaping) ---
  const outline = buildProjectOutline({
    title: fullProject.title,
    brief: fullProject.brief,
    lessons: fullProject.lessons.map((l) => ({ dayLabel: l.day, title: l.title, objective: l.objective })),
  });
  await assert(outline.includes(fullProject.brief), "project outline includes the brief");
  await assert(outline.includes("Launch Day"), "project outline includes each lesson title");

  const tutorialOutline = buildTutorialOutline({
    learningObjective: "Students will learn three-point lighting.",
    segments: [{ narration: "First, set your key light." }, { narration: "Next, add fill." }],
  });
  await assert(
    tutorialOutline.includes("First, set your key light.") && tutorialOutline.includes("Next, add fill."),
    "tutorial outline includes every segment's narration in order",
  );

  // --- Google Docs content builder ---
  const docContent = buildProjectDocContent({
    title: fullProject.title,
    classPeriodName: fullProject.classPeriod.name,
    brief: fullProject.brief,
    lessons: fullProject.lessons.map((l) => ({ dayLabel: l.day, title: l.title, objective: l.objective, iCanStatement: l.iCanStatement })),
  });
  await assert(docContent.includes(fullProject.classPeriod.name), "Google Doc content includes the class period name");
  await assert(docContent.includes("I can: I can explain the project goal."), "Google Doc content includes each lesson's I-can statement");

  // Cleanup.
  await db.project.delete({ where: { id: project.id } });

  console.log("\nAll Phase 11 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
