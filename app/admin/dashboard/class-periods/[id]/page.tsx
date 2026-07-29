import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassPeriodEditor } from "@/components/class-period-editor";

export default async function ClassPeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/dashboard/class-periods/${id}`);
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  if (!session.user.organizationId) redirect("/onboarding");

  const classPeriod = await db.classPeriod.findUnique({
    where: { id },
    include: { enrollments: { include: { student: true } } },
  });
  if (!classPeriod || classPeriod.organizationId !== session.user.organizationId) notFound();

  const [teachers, allStudents] = await Promise.all([
    db.user.findMany({
      where: { organizationId: session.user.organizationId, role: "TEACHER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { organizationId: session.user.organizationId, role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const enrolledIds = new Set(classPeriod.enrollments.map((e) => e.studentId));
  const enrolledStudents = classPeriod.enrollments.map((e) => e.student);
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{classPeriod.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassPeriodEditor
            classPeriodId={classPeriod.id}
            initialName={classPeriod.name}
            initialPeriod={classPeriod.period ?? ""}
            initialGradeLevel={classPeriod.gradeLevel}
            initialTeacherId={classPeriod.teacherId}
            teachers={teachers}
            enrolledStudents={enrolledStudents}
            availableStudents={availableStudents}
          />
        </CardContent>
      </Card>
    </main>
  );
}
