import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/org-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard/settings");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  if (!session.user.organizationId) redirect("/onboarding");

  const organization = await db.organization.findUniqueOrThrow({ where: { id: session.user.organizationId } });

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">School Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm
            organizationId={organization.id}
            initialName={organization.name}
            initialDistrict={organization.district ?? ""}
            initialCdsCode={organization.cdsCode ?? ""}
          />
        </CardContent>
      </Card>
    </main>
  );
}
