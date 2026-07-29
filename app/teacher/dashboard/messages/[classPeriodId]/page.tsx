import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageComposer } from "@/components/message-composer";

export default async function ClassMessagesPage({
  params,
}: {
  params: Promise<{ classPeriodId: string }>;
}) {
  const { classPeriodId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/teacher/dashboard/messages/${classPeriodId}`);

  const classPeriod = await db.classPeriod.findUnique({
    where: { id: classPeriodId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  if (!classPeriod) notFound();
  if (classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Parent Communication</h1>
        <p className="text-studio-ink/60 dark:text-white/60">{classPeriod.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New message</CardTitle>
        </CardHeader>
        <CardContent>
          <MessageComposer classPeriodId={classPeriodId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {classPeriod.messages.length === 0 ? (
            <p className="text-sm text-studio-ink/60 dark:text-white/60">No messages sent yet.</p>
          ) : (
            classPeriod.messages.map((message) => (
              <div key={message.id} className="border-b border-studio-ink/10 pb-3 text-sm dark:border-white/10">
                <p className="font-medium">{message.subject}</p>
                <p className="text-studio-ink/60 dark:text-white/60">{message.body}</p>
                <p className="mt-1 text-xs text-studio-ink/40 dark:text-white/40">
                  {message.createdAt.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
