import PptxGenJS from "pptxgenjs";
import type { Prisma } from "@prisma/client";

type ProjectForExport = Prisma.ProjectGetPayload<{
  include: { classPeriod: true; lessons: true };
}>;

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};
const DAY_ORDER = Object.keys(DAY_LABELS);

interface AgendaBlock {
  label: string;
  minutes: number;
  description: string;
}

export async function renderProjectPptx(project: ProjectForExport): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const lessons = [...project.lessons].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  const title = pptx.addSlide();
  title.addText(project.title, { x: 0.5, y: 2, w: 9, h: 1.2, fontSize: 32, bold: true });
  title.addText(project.classPeriod.name, { x: 0.5, y: 3.1, w: 9, h: 0.6, fontSize: 16, color: "666666" });

  for (const lesson of lessons) {
    const slide = pptx.addSlide();
    slide.addText(`${DAY_LABELS[lesson.day]}: ${lesson.title}`, {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
    });
    slide.addText(lesson.iCanStatement, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.6,
      fontSize: 14,
      italic: true,
      color: "444444",
    });

    const agenda = lesson.agenda as unknown as AgendaBlock[];
    const bullets = agenda.map((block) => ({
      text: `${block.label} (${block.minutes} min): ${block.description}`,
      options: { bullet: true, breakLine: true },
    }));
    slide.addText(bullets, { x: 0.5, y: 2, w: 9, h: 4.5, fontSize: 14, valign: "top" });
  }

  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" });
  return Buffer.from(arrayBuffer as ArrayBuffer);
}
