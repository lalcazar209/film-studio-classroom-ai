import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceForm } from "@/components/attendance-form";
import type { AttendanceStatus } from "@prisma/client";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classPeriodId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classPeriodId } = await params;
  const { date } = await searchParams;
  const targetDate = date ?? todayISODate();

  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/dashboard/attendance/${classPeriodId}`);

  const classPeriod = await db.classPeriod.findUnique({
    where: { id: classPeriodId },
    include: {
      enrollments: { include: { student: true }, orderBy: { student: { name: "asc" } } },
    },
  });

  if (!classPeriod) notFound();
  if (classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const existingRecords = await db.attendanceRecord.findMany({
    where: { classPeriodId, date: new Date(`${targetDate}T00:00:00.000Z`) },
  });
  const statusByStudent = new Map(existingRecords.map((r) => [r.studentId, r.status]));

  const students = classPeriod.enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name,
    email: e.student.email,
    status: (statusByStudent.get(e.student.id) ?? "PRESENT") as AttendanceStatus,
  }));

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Attendance</h1>
        <p className="text-studio-ink/60 dark:text-white/60">
          {classPeriod.name} · {targetDate}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>P = Present · A = Absent · T = Tardy · E = Excused</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceForm classPeriodId={classPeriodId} date={targetDate} initialStudents={students} />
        </CardContent>
      </Card>
    </main>
  );
}
