import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CinemaPage } from "@/components/ui/cinema-page";
import { CinemaCard, CinemaCardContent, CinemaCardHeader, CinemaCardTitle } from "@/components/ui/cinema-card";
import { SkillsUsaGeneratorForm } from "@/components/skillsusa-generator-form";

export default async function TeacherSkillsUsaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/skillsusa");
  if (!session.user.organizationId) redirect("/onboarding");

  const practices = await db.skillsUsaPractice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CinemaPage
      title="SkillsUSA Mode"
      description="Competition practice packages: timed challenges, rubrics, judge sheets, mock competition schedules, and extra practice scenarios."
    >
      <div className="space-y-6">
        <SkillsUsaGeneratorForm />

        <CinemaCard>
          <CinemaCardHeader>
            <CinemaCardTitle>Library</CinemaCardTitle>
          </CinemaCardHeader>
          <CinemaCardContent>
            {practices.length === 0 ? (
              <p className="text-sm text-cinema-muted">No practice packages generated yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {practices.map((practice) => (
                  <li key={practice.id} className="flex items-center justify-between">
                    <Link href={`/teacher/dashboard/skillsusa/${practice.id}`} className="text-cinema-white hover:text-cinema-red">
                      {practice.contestName}
                    </Link>
                    <span className="text-xs text-cinema-muted">{practice.createdAt.toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CinemaCardContent>
        </CinemaCard>
      </div>
    </CinemaPage>
  );
}
