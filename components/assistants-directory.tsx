import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";
import { ASSISTANTS } from "@/lib/ai/assistants";

/** Shared across Teacher, Mentor, and Student portals — `theme="cinema"`
 * is opt-in per caller so only the Student portal (mid-migration to the
 * cinematic redesign) gets the dark styling; Teacher/Mentor are untouched. */
export function AssistantsDirectory({ basePath, theme = "default" }: { basePath: string; theme?: "default" | "cinema" }) {
  if (theme === "cinema") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {ASSISTANTS.map((assistant) => (
          <Link key={assistant.id} href={`${basePath}/${assistant.id}`}>
            <CinemaCard className="h-full transition-colors hover:border-cinema-red/50">
              <CinemaCardHeader>
                <CinemaCardTitle className="text-base">{assistant.name}</CinemaCardTitle>
              </CinemaCardHeader>
              <CinemaCardContent className="text-sm text-cinema-muted">{assistant.tagline}</CinemaCardContent>
            </CinemaCard>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ASSISTANTS.map((assistant) => (
        <Link key={assistant.id} href={`${basePath}/${assistant.id}`}>
          <Card className="h-full transition-colors hover:border-studio-accent">
            <CardHeader>
              <CardTitle className="text-base">{assistant.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-studio-ink/60 dark:text-white/60">{assistant.tagline}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
