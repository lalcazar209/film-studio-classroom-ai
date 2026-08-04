import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SkillsUsaPracticeView } from "@/components/skillsusa-practice-view";
import type { SkillsUsaBundle } from "@/lib/ai/schemas";

export default async function StudentSkillsUsaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/student/dashboard/skillsusa/${id}`);

  const practice = await db.skillsUsaPractice.findUnique({ where: { id } });
  if (!practice) notFound();
  if (practice.organizationId !== session.user.organizationId) redirect("/unauthorized");

  return (
    <main className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-cinema-charcoal px-4 py-6 text-cinema-white shadow-cinema-panel sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />
      <div className="relative">
        <SkillsUsaPracticeView
          contestName={practice.contestName}
          competitionOverview={practice.competitionOverview}
          timedChallenge={practice.timedChallenge as unknown as SkillsUsaBundle["timedChallenge"]}
          rubric={practice.rubric as unknown as SkillsUsaBundle["rubric"]}
          judgeSheet={practice.judgeSheet as unknown as SkillsUsaBundle["judgeSheet"]}
          mockCompetitionSchedule={practice.mockCompetitionSchedule as unknown as SkillsUsaBundle["mockCompetitionSchedule"]}
          scenarioBank={practice.scenarioBank as unknown as SkillsUsaBundle["scenarioBank"]}
          theme="cinema"
        />
      </div>
    </main>
  );
}
