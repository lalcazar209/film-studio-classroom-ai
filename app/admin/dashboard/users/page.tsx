import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagementRow } from "@/components/user-management-row";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard/users");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  if (!session.user.organizationId) redirect("/onboarding");

  const users = await db.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>All members</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="pb-2">Name</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserManagementRow
                  key={user.id}
                  user={{ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive }}
                  isSelf={user.id === session.user.id}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
