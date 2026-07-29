import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  PROJECT_ARCHIVE: "Project",
  CERTIFICATE: "Certificate",
  BADGE: "Badge",
  RESUME: "Resume",
  DEMO_REEL: "Demo Reel",
};

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/portfolio");

  const items = await db.portfolioItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">Digital Portfolio</h1>
      <p className="text-studio-ink/60 dark:text-white/60">
        Automatically archived whenever you submit a project, plus your resume and demo reel.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-studio-ink/60 dark:text-white/60">
          Nothing here yet — submit a project to start building your portfolio.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <p className="text-xs uppercase tracking-wide text-studio-accent">
                  {TYPE_LABELS[item.type] ?? item.type}
                </p>
              </CardHeader>
              <CardContent>
                {item.assetUrl ? (
                  <a
                    href={item.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-studio-accent hover:underline"
                  >
                    View
                  </a>
                ) : (
                  <p className="text-sm text-studio-ink/50 dark:text-white/50">
                    {item.createdAt.toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
