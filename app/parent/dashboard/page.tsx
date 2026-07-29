import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/dashboard");

  const links = await db.parentLink.findMany({
    where: { parentId: session.user.id },
    include: {
      student: {
        include: {
          enrollments: {
            include: {
              classPeriod: {
                include: { messages: { orderBy: { createdAt: "desc" }, take: 5 } },
              },
            },
          },
          submissions: { orderBy: { createdAt: "desc" }, take: 3, include: { project: true } },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Family Portal</h1>

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-black/60 dark:text-white/60">
            No students linked to your account yet. Contact your school to connect your child&apos;s
            record.
          </CardContent>
        </Card>
      ) : (
        links.map(({ student }) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.name ?? student.email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {student.enrollments.map((e) => (
                <p key={e.id}>{e.classPeriod.name}</p>
              ))}

              {student.submissions.length > 0 && (
                <div>
                  <p className="font-medium">Recent submissions</p>
                  {student.submissions.map((s) => (
                    <p key={s.id} className="text-black/60 dark:text-white/60">
                      {s.project.title} — {s.status}
                    </p>
                  ))}
                </div>
              )}

              {student.enrollments.some((e) => e.classPeriod.messages.length > 0) && (
                <div>
                  <p className="font-medium">Messages from teachers</p>
                  {student.enrollments.flatMap((e) =>
                    e.classPeriod.messages.map((m) => (
                      <div key={m.id} className="mt-1 border-l-2 border-studio-accent pl-2">
                        <p className="font-medium">{m.subject}</p>
                        <p className="text-black/60 dark:text-white/60">{m.body}</p>
                      </div>
                    )),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
