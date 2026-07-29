import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard/reports");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  if (!session.user.organizationId) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-studio-ink/60 dark:text-white/60">
            Every enrolled student, their class period, and their teacher.
          </p>
          <a href="/api/admin/reports/roster" className="text-sm text-studio-accent hover:underline">
            Download roster.csv
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standards Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-studio-ink/60 dark:text-white/60">
            Every California CTE/VAPA/ISTE standard your generated projects have touched, and
            which project/class period covered it.
          </p>
          <a href="/api/admin/reports/standards-coverage" className="text-sm text-studio-accent hover:underline">
            Download standards-coverage.csv
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
