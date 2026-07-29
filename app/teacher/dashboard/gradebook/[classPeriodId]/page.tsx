import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GradebookGrid, type GradebookColumn, type GradebookRow } from "@/components/gradebook-grid";

export default async function GradebookPage({
  params,
}: {
  params: Promise<{ classPeriodId: string }>;
}) {
  const { classPeriodId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/dashboard/gradebook/${classPeriodId}`);

  const classPeriod = await db.classPeriod.findUnique({
    where: { id: classPeriodId },
    include: {
      enrollments: { include: { student: true }, orderBy: { student: { name: "asc" } } },
      projects: {
        where: { status: "READY" },
        orderBy: { createdAt: "asc" },
        include: { submissions: true },
      },
    },
  });

  if (!classPeriod) notFound();
  if (classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const columns: GradebookColumn[] = classPeriod.projects.map((p) => ({
    projectId: p.id,
    title: p.title,
    maxPoints: 100,
  }));

  const rows: GradebookRow[] = classPeriod.enrollments.map((enrollment) => {
    const cells: GradebookRow["cells"] = {};
    for (const project of classPeriod.projects) {
      const submission = project.submissions.find((s) => s.studentId === enrollment.studentId);
      if (submission) {
        const grade = submission.grade as { total?: number; feedback?: string } | null;
        cells[project.id] = {
          submissionId: submission.id,
          status: submission.status,
          total: grade?.total ?? null,
          feedback: grade?.feedback ?? "",
        };
      }
    }
    return {
      studentId: enrollment.studentId,
      studentName: enrollment.student.name ?? enrollment.student.email,
      cells,
    };
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-bold">Gradebook</h1>
        <p className="text-black/60 dark:text-white/60">{classPeriod.name}</p>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No projects generated for this class period yet.
        </p>
      ) : (
        <GradebookGrid columns={columns} rows={rows} />
      )}
    </main>
  );
}
