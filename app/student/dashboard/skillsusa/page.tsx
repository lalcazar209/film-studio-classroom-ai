import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent } from "@/components/ui/cinema-card";

export default async function StudentSkillsUsaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/dashboard/skillsusa");
  if (!session.user.organizationId) redirect("/onboarding");

  const practices = await db.skillsUsaPractice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CinemaPage
        eyebrow="Student Portal"
        title="SkillsUSA Mode"
        description="Practice for your competition: timed challenges, rubrics, and extra scenarios."
      >
        <CinemaCard>
          <CinemaCardContent className="pt-6">
            {practices.length === 0 ? (
              <p className="text-sm text-cinema-muted">No practice packages available yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {practices.map((practice) => (
                  <li key={practice.id} className="flex items-center justify-between">
                    <Link
                      href={`/student/dashboard/skillsusa/${practice.id}`}
                      className="text-cinema-white/90 hover:text-cinema-red"
                    >
                      {practice.contestName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CinemaCardContent>
        </CinemaCard>
      </CinemaPage>
    </main>
  );
}
