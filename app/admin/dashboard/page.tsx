import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard");
  if (!session.user.organizationId) redirect("/onboarding");

  const organizationId = session.user.organizationId;

  const [teacherCount, studentCount, projectCount, classPeriodCount] = await Promise.all([
    db.user.count({ where: { organizationId, role: "TEACHER" } }),
    db.user.count({ where: { organizationId, role: "STUDENT" } }),
    db.project.count({ where: { classPeriod: { organizationId } } }),
    db.classPeriod.count({ where: { organizationId } }),
  ]);

  const stats = [
    { label: "Class Periods", value: classPeriodCount, color: "text-studio-accent" },
    { label: "Teachers", value: teacherCount, color: "text-studio-sky" },
    { label: "Students", value: studentCount, color: "text-studio-coral" },
    { label: "Projects Generated", value: projectCount, color: "text-studio-gold" },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-studio-gold">Overview</p>
        <h1 className="font-display text-3xl font-extrabold">Admin Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="border-b-0 pb-0">
              <CardTitle className={cn("text-3xl", stat.color)}>{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 text-sm text-black/60 dark:text-white/60">
              {stat.label}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
