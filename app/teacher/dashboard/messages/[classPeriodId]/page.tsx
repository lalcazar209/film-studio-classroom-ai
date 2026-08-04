import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
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
    <CinemaPage title="Parent Communication" description={classPeriod.name}>
      <div className="space-y-6">
        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>New message</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            <MessageComposer classPeriodId={classPeriodId} />
          </CinemaCardContent>
        </CinemaCard>

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Sent</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent className="space-y-3">
            {classPeriod.messages.length === 0 ? (
              <p className="text-sm text-cinema-muted">No messages sent yet.</p>
            ) : (
              classPeriod.messages.map((message) => (
                <div key={message.id} className="border-b border-cinema-border pb-3 text-sm">
                  <p className="font-medium text-cinema-white">{message.subject}</p>
                  <p className="text-cinema-white/70">{message.body}</p>
                  <p className="mt-1 text-xs text-cinema-muted">{message.createdAt.toLocaleString()}</p>
                </div>
              ))
            )}
          </CinemaCardContent>
        </CinemaCard>
      </div>
    </CinemaPage>
  );
}
