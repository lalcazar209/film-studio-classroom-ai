import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeacherDashboardCinema } from "@/components/teacher/teacher-dashboard-cinema";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard");

  const classPeriods = await db.classPeriod.findMany({
    where: { teacherId: session.user.id },
    include: {
      projects: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });

  const [totalProjects, pendingReviews] = await Promise.all([
    db.project.count({ where: { classPeriod: { teacherId: session.user.id } } }),
    db.submission.count({
      where: {
        status: { in: ["SUBMITTED", "REVIEWED"] },
        project: { classPeriod: { teacherId: session.user.id } },
      },
    }),
  ]);

  const totalStudents = classPeriods.reduce((sum, cp) => sum + cp._count.enrollments, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <TeacherDashboardCinema
        teacherName={session.user.name ?? session.user.email ?? "Teacher"}
        stats={{
          classPeriodCount: classPeriods.length,
          totalStudents,
          totalProjects,
          pendingReviews,
        }}
        classPeriods={classPeriods.map((cp) => ({
          id: cp.id,
          name: cp.name,
          gradeLevel: cp.gradeLevel,
          studentCount: cp._count.enrollments,
          projects: cp.projects.map((p) => ({ id: p.id, title: p.title, category: p.category, status: p.status })),
        }))}
      />
    </main>
  );
}
