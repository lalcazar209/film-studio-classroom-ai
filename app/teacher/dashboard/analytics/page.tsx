import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";

function Bar({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-cinema-white">
        <span>{label}</span>
        <span>
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full rounded bg-white/10">
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
    <CinemaPage title="Analytics">
      {classPeriods.length === 0 ? (
        <p className="text-sm text-cinema-muted">No class periods yet.</p>
      ) : (
        <div className="space-y-6">
          {classPeriods.map((cp) => {
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
              <CinemaCard key={cp.id}>
                <CinemaCardHeader>
                  <CinemaCardTitle>
                    {cp.name} · {cp._count.enrollments} students
                  </CinemaCardTitle>
                </CinemaCardHeader>
                <CinemaCardContent className="space-y-4">
                  <Bar label="Work started" value={submitted} total={submissionTotal} colorClass="bg-cinema-blue" />
                  <Bar label="Graded" value={graded} total={submissionTotal} colorClass="bg-cinema-orange" />
                  <Bar label="Attendance (present, last 30 days)" value={present} total={attendanceTotal} colorClass="bg-green-500" />
                  {avgGrade !== null && <p className="text-sm text-cinema-muted">Average grade: {avgGrade}/100</p>}
                </CinemaCardContent>
              </CinemaCard>
            );
          })}
        </div>
      )}
    </CinemaPage>
  );
}
