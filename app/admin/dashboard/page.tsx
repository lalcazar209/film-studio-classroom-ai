import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    { label: "Class Periods", value: classPeriodCount },
    { label: "Teachers", value: teacherCount },
    { label: "Students", value: studentCount },
    { label: "Projects Generated", value: projectCount },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/admin/dashboard/invites">
          <Button variant="secondary">Manage Invites</Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-black/60 dark:text-white/60">
              {stat.label}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
