import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";

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
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CinemaPage
        eyebrow="Student Portal"
        title="Digital Portfolio"
        description="Automatically archived whenever you submit a project, plus your resume and demo reel."
      >
        {items.length === 0 ? (
          <p className="text-sm text-cinema-muted">
            Nothing here yet — submit a project to start building your portfolio.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <CinemaCard key={item.id}>
                <CinemaCardHeader>
                  <CinemaCardTitle className="text-base">{item.title}</CinemaCardTitle>
                  <p className="text-xs uppercase tracking-wide text-cinema-red">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </p>
                </CinemaCardHeader>
                <CinemaCardContent>
                  {item.assetUrl ? (
                    <a
                      href={item.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-cinema-red hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <p className="text-sm text-cinema-muted">{item.createdAt.toLocaleDateString()}</p>
                  )}
                </CinemaCardContent>
              </CinemaCard>
            ))}
          </div>
        )}
      </CinemaPage>
    </main>
  );
}
