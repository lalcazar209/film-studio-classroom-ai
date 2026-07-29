import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassPeriodForm } from "@/components/class-period-form";

export default async function ClassPeriodsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard/class-periods");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  if (!session.user.organizationId) redirect("/onboarding");

  const [classPeriods, teachers] = await Promise.all([
    db.classPeriod.findMany({
      where: { organizationId: session.user.organizationId },
      include: { teacher: true, _count: { select: { enrollments: true, projects: true } } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { organizationId: session.user.organizationId, role: "TEACHER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Class Periods</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create a class period</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassPeriodForm teachers={teachers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All class periods</CardTitle>
        </CardHeader>
        <CardContent>
          {classPeriods.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">None yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {classPeriods.map((cp) => (
                <li key={cp.id} className="flex items-center justify-between">
                  <Link href={`/admin/dashboard/class-periods/${cp.id}`} className="hover:text-studio-accent">
                    {cp.name} · Grade {cp.gradeLevel}
                  </Link>
                  <span className="text-xs text-studio-ink/50 dark:text-white/50">
                    {cp.teacher.name ?? cp.teacher.email} · {cp._count.enrollments} students
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
