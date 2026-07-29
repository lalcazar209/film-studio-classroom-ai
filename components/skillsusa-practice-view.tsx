import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/countdown-timer";
import type { SkillsUsaBundle } from "@/lib/ai/schemas";

export function SkillsUsaPracticeView({
  contestName,
  competitionOverview,
  timedChallenge,
  rubric,
  judgeSheet,
  mockCompetitionSchedule,
  scenarioBank,
}: {
  contestName: string;
  competitionOverview: string;
  timedChallenge: SkillsUsaBundle["timedChallenge"];
  rubric: SkillsUsaBundle["rubric"];
  judgeSheet: SkillsUsaBundle["judgeSheet"];
  mockCompetitionSchedule: SkillsUsaBundle["mockCompetitionSchedule"];
  scenarioBank: SkillsUsaBundle["scenarioBank"];
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-studio-accent">SkillsUSA Practice</p>
        <h1 className="font-display text-3xl font-extrabold">{contestName}</h1>
        <p className="mt-1 text-studio-ink/60 dark:text-white/60">{competitionOverview}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Timed challenge — {timedChallenge.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
          <CountdownTimer minutes={timedChallenge.timeLimitMinutes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rubric — {rubric.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {rubric.criteria.map((c, i) => (
            <div key={i} className="flex justify-between">
              <span>{c.name}</span>
              <span>{c.weightPercent}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Judge sheet — {judgeSheet.totalPossiblePoints} points possible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {judgeSheet.criteria.map((c, i) => (
            <div key={i}>
              <div className="flex justify-between font-medium">
                <span>{c.name}</span>
                <span>{c.maxPoints} pts</span>
              </div>
              <p className="text-studio-ink/60 dark:text-white/60">{c.guidance}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mock competition schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {mockCompetitionSchedule.map((s, i) => (
            <p key={i}>
              <span className="font-medium">{s.time}: </span>
              {s.activity}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>More practice scenarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {scenarioBank.map((s, i) => (
            <div key={i}>
              <p className="font-medium">{s.title}</p>
              <p className="text-studio-ink/60 dark:text-white/60">{s.prompt}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
