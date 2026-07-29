import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateGammaAndWait, buildProjectOutline, GammaError } from "@/lib/export/gamma";

const DAY_LABELS: Record<string, string> = {
  MONDAY_LAUNCH: "Monday — Launch",
  TUESDAY_PREPRODUCTION: "Tuesday — Pre-Production",
  WEDNESDAY_PRODUCTION: "Wednesday — Production",
  THURSDAY_EDITING: "Thursday — Editing",
  FRIDAY_SHOWCASE: "Friday — Showcase",
};
const DAY_ORDER = Object.keys(DAY_LABELS);

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.project.findUnique({
    where: { id },
    include: { classPeriod: true, lessons: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lessons = [...project.lessons]
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
    .map((l) => ({ dayLabel: DAY_LABELS[l.day] ?? l.day, title: l.title, objective: l.objective }));

  try {
    const gammaUrl = await generateGammaAndWait({
      title: project.title,
      outline: buildProjectOutline({ title: project.title, brief: project.brief, lessons }),
    });

    await db.project.update({ where: { id }, data: { gammaUrl } });

    return NextResponse.json({ gammaUrl });
  } catch (error) {
    if (error instanceof GammaError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("Gamma export failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
