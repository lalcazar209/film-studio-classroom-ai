import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";
import { CountdownTimer } from "@/components/countdown-timer";
import type { SkillsUsaBundle } from "@/lib/ai/schemas";

/** Shared across Teacher and Student portals — see AssistantsDirectory for
 * why `theme` is opt-in per caller. */
export function SkillsUsaPracticeView({
  contestName,
  competitionOverview,
  timedChallenge,
  rubric,
  judgeSheet,
  mockCompetitionSchedule,
  scenarioBank,
  theme = "default",
}: {
  contestName: string;
  competitionOverview: string;
  timedChallenge: SkillsUsaBundle["timedChallenge"];
  rubric: SkillsUsaBundle["rubric"];
  judgeSheet: SkillsUsaBundle["judgeSheet"];
  mockCompetitionSchedule: SkillsUsaBundle["mockCompetitionSchedule"];
  scenarioBank: SkillsUsaBundle["scenarioBank"];
  theme?: "default" | "cinema";
}) {
  const [SectionCard, SectionHeader, SectionTitle, SectionContent] =
    theme === "cinema"
      ? [CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent]
      : [Card, CardHeader, CardTitle, CardContent];
  const mutedClass = theme === "cinema" ? "text-cinema-muted" : "text-studio-ink/60 dark:text-white/60";

  return (
    <div className="space-y-6">
      <header>
        <p className={`text-sm uppercase tracking-wide ${theme === "cinema" ? "text-cinema-red" : "text-studio-accent"}`}>
          SkillsUSA Practice
        </p>
        <h1 className={`font-display text-3xl font-extrabold ${theme === "cinema" ? "text-cinema-white" : ""}`}>
          {contestName}
        </h1>
        <p className={`mt-1 ${mutedClass}`}>{competitionOverview}</p>
      </header>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Timed challenge — {timedChallenge.title}</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-3 text-sm">
          <p>{timedChallenge.scenario}</p>
          <p>
            <span className="font-medium">Deliverable: </span>
            {timedChallenge.deliverable}
          </p>
          {timedChallenge.constraints.length > 0 && (
            <div>
              <p className="font-medium">Constraints</p>
              <ul className="list-inside list-disc">
                {timedChallenge.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <CountdownTimer minutes={timedChallenge.timeLimitMinutes} theme={theme} />
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Rubric — {rubric.title}</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-1 text-sm">
          {rubric.criteria.map((c, i) => (
            <div key={i} className="flex justify-between">
              <span>{c.name}</span>
              <span>{c.weightPercent}%</span>
            </div>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Judge sheet — {judgeSheet.totalPossiblePoints} points possible</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-2 text-sm">
          {judgeSheet.criteria.map((c, i) => (
            <div key={i}>
              <div className="flex justify-between font-medium">
                <span>{c.name}</span>
                <span>{c.maxPoints} pts</span>
              </div>
              <p className={mutedClass}>{c.guidance}</p>
            </div>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Mock competition schedule</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-1 text-sm">
          {mockCompetitionSchedule.map((s, i) => (
            <p key={i}>
              <span className="font-medium">{s.time}: </span>
              {s.activity}
            </p>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>More practice scenarios</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-3 text-sm">
          {scenarioBank.map((s, i) => (
            <div key={i}>
              <p className="font-medium">{s.title}</p>
              <p className={mutedClass}>{s.prompt}</p>
            </div>
          ))}
        </SectionContent>
      </SectionCard>
    </div>
  );
}
