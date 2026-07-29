import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Bar({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full rounded bg-black/10 dark:bg-white/10">
        <div className={`h-2 rounded ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function TeacherAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/analytics");

  const classPeriods = await db.classPeriod.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { enrollments: true } },
      projects: { include: { submissions: true } },
      attendance: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Analytics</h1>

      {classPeriods.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No class periods yet.</p>
      ) : (
        classPeriods.map((cp) => {
          const submissions = cp.projects.flatMap((p) => p.submissions);
          const submissionTotal = submissions.length;
          const submitted = submissions.filter((s) => s.status !== "NOT_STARTED").length;
          const graded = submissions.filter((s) => s.status === "GRADED").length;
          const grades = submissions
            .map((s) => (s.grade as { total?: number } | null)?.total)
            .filter((n): n is number => typeof n === "number");
          const avgGrade = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

          const attendanceTotal = cp.attendance.length;
          const present = cp.attendance.filter((a) => a.status === "PRESENT").length;

          return (
            <Card key={cp.id}>
              <CardHeader>
                <CardTitle>
                  {cp.name} · {cp._count.enrollments} students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Bar label="Work started" value={submitted} total={submissionTotal} colorClass="bg-studio-accent" />
                <Bar label="Graded" value={graded} total={submissionTotal} colorClass="bg-studio-gold" />
                <Bar label="Attendance (present, last 30 days)" value={present} total={attendanceTotal} colorClass="bg-green-600" />
                {avgGrade !== null && (
                  <p className="text-sm text-black/60 dark:text-white/60">Average grade: {avgGrade}/100</p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </main>
  );
}
