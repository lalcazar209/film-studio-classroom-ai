import { redirect } from "next/navigation";
import { auth, ROLE_HOME } from "@/lib/auth";
import { db } from "@/lib/db";
import { acceptInvite } from "@/lib/invites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/invite/${token}`);

  const invite = await db.invite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) {
    return <StatusPage title="Invite not found" message="This invite link is invalid." />;
  }
  if (invite.acceptedAt) {
    return <StatusPage title="Already accepted" message="This invite has already been used." />;
  }
  if (invite.expiresAt < new Date()) {
    return <StatusPage title="Invite expired" message="Ask your admin to send a new invite." />;
  }
  if (invite.email !== session.user.email?.toLowerCase()) {
    return (
      <StatusPage
        title="Wrong account"
        message={`This invite was sent to ${invite.email}. Sign in with that email to accept it.`}
      />
    );
  }

  async function accept() {
    "use server";
    const currentSession = await auth();
    if (!currentSession?.user) redirect(`/login?callbackUrl=/invite/${token}`);

    const result = await acceptInvite(token, currentSession.user.id, currentSession.user.email ?? "");
    if (!result.ok) {
      redirect(`/invite/${token}`);
    }
    redirect(ROLE_HOME[result.role]);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invite.organization.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-black/60 dark:text-white/60">
            You&apos;ve been invited to join as a <strong>{invite.role.toLowerCase()}</strong>.
          </p>
          <form action={accept}>
            <Button type="submit">Accept invite</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function StatusPage({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">{message}</p>
      </div>
    </main>
  );
}
