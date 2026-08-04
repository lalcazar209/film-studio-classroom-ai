import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StudentDashboardCinema } from "@/components/student/student-dashboard-cinema";

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard");

  const [enrollments, completedProjects, totalAssignedProjects, portfolioItemCount] = await Promise.all([
    db.enrollment.findMany({
      where: { studentId: session.user.id },
      include: {
        classPeriod: {
          include: { projects: { orderBy: { createdAt: "desc" }, take: 5 } },
        },
      },
    }),
    db.submission.count({ where: { studentId: session.user.id, status: "GRADED" } }),
    db.project.count({ where: { classPeriod: { enrollments: { some: { studentId: session.user.id } } } } }),
    db.portfolioItem.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <StudentDashboardCinema
        studentName={session.user.name ?? session.user.email ?? "Student"}
        stats={{
          completedProjects,
          totalAssignedProjects,
          portfolioItemCount,
          enrolledClassCount: enrollments.length,
        }}
        classPeriods={enrollments.map(({ classPeriod }) => ({
          id: classPeriod.id,
          name: classPeriod.name,
          projects: classPeriod.projects.map((p) => ({ id: p.id, title: p.title, category: p.category })),
        }))}
      />
    </main>
  );
}
