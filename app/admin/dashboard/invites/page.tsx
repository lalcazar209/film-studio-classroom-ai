import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm } from "@/components/invite-form";

export default async function InvitesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard/invites");
  if (!session.user.organizationId) redirect("/onboarding");

  const [students, invites] = await Promise.all([
    db.user.findMany({
      where: { organizationId: session.user.organizationId, role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.invite.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Invites</h1>

      <Card>
        <CardHeader>
          <CardTitle>Send an invite</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm students={students} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent invites</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">No invites sent yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {invites.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between">
                  <span>
                    {invite.email} · {invite.role}
                  </span>
                  <span className="text-xs text-studio-ink/50 dark:text-white/50">
                    {invite.acceptedAt
                      ? "Accepted"
                      : invite.expiresAt < new Date()
                        ? "Expired"
                        : "Pending"}
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
