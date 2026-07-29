import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { Prisma } from "@prisma/client";

type ProjectForExport = Prisma.ProjectGetPayload<{
  include: {
    classPeriod: true;
    lessons: { include: { standards: { include: { standard: true } } } };
    rubric: true;
    quiz: true;
    vocabulary: true;
  };
}>;

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};
const DAY_ORDER = Object.keys(DAY_LABELS);

interface RubricCriterion {
  name: string;
  weightPercent: number;
}

interface QuizQuestion {
  prompt: string;
}

export async function renderProjectDocx(project: ProjectForExport): Promise<Buffer> {
  const lessons = [...project.lessons].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const criteria = (project.rubric?.criteria as unknown as RubricCriterion[] | undefined) ?? [];
  const questions = (project.quiz?.questions as unknown as QuizQuestion[] | undefined) ?? [];

  const children: Paragraph[] = [
    new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `${project.classPeriod.name} — Teacher Guide`, heading: HeadingLevel.HEADING_3 }),
    new Paragraph({ text: project.brief }),
  ];

  for (const lesson of lessons) {
    children.push(
      new Paragraph({ text: `${DAY_LABELS[lesson.day]}: ${lesson.title}`, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [new TextRun({ text: "Objective: ", bold: true }), new TextRun(lesson.objective)],
      }),
      new Paragraph({
        children: [new TextRun({ text: "I can: ", bold: true }), new TextRun(lesson.iCanStatement)],
      }),
    );
    if (lesson.standards.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Standards: ", bold: true }),
            new TextRun(lesson.standards.map((s) => s.standard.code).join(", ")),
          ],
        }),
      );
    }
  }

  if (project.rubric) {
    children.push(new Paragraph({ text: `Rubric — ${project.rubric.title}`, heading: HeadingLevel.HEADING_2 }));
    for (const criterion of criteria) {
      children.push(new Paragraph({ text: `${criterion.name} — ${criterion.weightPercent}%` }));
    }
  }

  if (project.quiz) {
    children.push(new Paragraph({ text: `Quiz — ${project.quiz.title}`, heading: HeadingLevel.HEADING_2 }));
    questions.forEach((q, i) => children.push(new Paragraph({ text: `${i + 1}. ${q.prompt}` })));
  }

  if (project.vocabulary.length > 0) {
    children.push(new Paragraph({ text: "Vocabulary", heading: HeadingLevel.HEADING_2 }));
    for (const term of project.vocabulary) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${term.term}: `, bold: true }), new TextRun(term.definition)],
        }),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
