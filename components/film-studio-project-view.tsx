import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent } from "@/components/ui/cinema-card";
import { PosterImagePanel } from "@/components/poster-image-panel";
import { cn } from "@/lib/utils/cn";
import type {
  FilmStudioBundle,
} from "@/lib/ai/schemas";

type ScreenplayScene = FilmStudioBundle["screenplay"]["scenes"][number];
type ShotListEntry = FilmStudioBundle["shotList"]["shots"][number];

/** Shared across Teacher and Mentor portals — see AssistantsDirectory for
 * why `theme` is opt-in per caller. */
export function FilmStudioProjectView({
  title,
  logline,
  genre,
  screenplay,
  shotList,
  callSheet,
  budget,
  equipmentList,
  locationPlan,
  castingSheet,
  marketingPlan,
  filmStudioProjectId,
  posterImageUrl,
  theme = "default",
}: {
  title: string;
  logline: string;
  genre: string;
  screenplay: { scenes: ScreenplayScene[] };
  shotList: { shots: ShotListEntry[] };
  callSheet: FilmStudioBundle["callSheet"];
  budget: FilmStudioBundle["budget"];
  equipmentList: FilmStudioBundle["equipmentList"];
  locationPlan: FilmStudioBundle["locationPlan"];
  castingSheet: FilmStudioBundle["castingSheet"];
  marketingPlan: FilmStudioBundle["marketingPlan"];
  /** Only passed on the teacher/creator's own view — omit to render
   * view-only (e.g. the mentor portal), showing the image if one exists
   * but no generate button. */
  filmStudioProjectId?: string;
  posterImageUrl?: string | null;
  theme?: "default" | "cinema";
}) {
  const isCinema = theme === "cinema";
  const [SectionCard, SectionHeader, SectionTitle, SectionContent] = isCinema
    ? [CinemaCard, CinemaCardHeader, CinemaCardTitle, CinemaCardContent]
    : [Card, CardHeader, CardTitle, CardContent];
  const mutedClass = isCinema ? "text-cinema-muted" : "text-studio-ink/60 dark:text-white/60";
  const dividerClass = isCinema ? "border-b border-white/10 pb-3 last:border-0" : "border-b border-studio-ink/10 pb-3 last:border-0 dark:border-white/10";

  return (
    <div className="space-y-6">
      <header>
        <p className={cn("text-sm uppercase tracking-wide", isCinema ? "text-cinema-red" : "text-studio-accent")}>{genre}</p>
        <h1 className={cn("font-display text-3xl font-extrabold", isCinema && "text-cinema-white")}>{title}</h1>
        <p className={cn("mt-1", mutedClass)}>{logline}</p>
      </header>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Screenplay</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-4 text-sm">
          {screenplay.scenes.map((scene) => (
            <div key={scene.sceneNumber} className={dividerClass}>
              <p className="font-mono font-medium">{scene.heading}</p>
              <p className="mt-1">{scene.action}</p>
              {scene.dialogue.map((line, i) => (
                <p key={i} className="mt-1 pl-4">
                  <span className="font-medium">{line.character}: </span>
                  {line.line}
                </p>
              ))}
            </div>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Shot list</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-2 text-sm">
          {shotList.shots.map((shot) => (
            <p key={shot.number}>
              <span className="font-medium">
                #{shot.number} (Scene {shot.sceneNumber}, {shot.shotType}):{" "}
              </span>
              {shot.description} — {shot.lens}, {shot.movement}, ~{shot.durationSeconds}s
            </p>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Call sheet</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-2 text-sm">
          <p>
            {callSheet.shootDate} · General call: {callSheet.generalCallTime} · {callSheet.location}
          </p>
          {callSheet.weather && <p>Weather: {callSheet.weather}</p>}
          <p className="font-medium">Cast</p>
          {callSheet.cast.map((c, i) => (
            <p key={i}>
              {c.role} — {c.callTime}
            </p>
          ))}
          <p className="font-medium">Crew</p>
          {callSheet.crew.map((c, i) => (
            <p key={i}>
              {c.role} — {c.callTime}
            </p>
          ))}
          <p className={mutedClass}>{callSheet.notes}</p>
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Budget — ${budget.totalEstimate.toLocaleString()} estimated</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-1 text-sm">
          {budget.lineItems.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>
                {item.category} — {item.item}
              </span>
              <span>${item.estimatedCost.toLocaleString()}</span>
            </div>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Equipment</SectionTitle>
        </SectionHeader>
        <SectionContent className="text-sm">
          {equipmentList.map((item, i) => (
            <p key={i}>
              {item.quantity}x {item.itemType}
              {item.notes ? ` — ${item.notes}` : ""}
            </p>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Locations</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-2 text-sm">
          {locationPlan.map((loc, i) => (
            <p key={i}>
              <span className="font-medium">{loc.name}</span>
              {loc.address ? ` — ${loc.address}` : ""} · {loc.notes}
              {loc.permitsNeeded && <span className="ml-2 text-amber-600 dark:text-amber-400">Permit needed</span>}
            </p>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Casting</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-1 text-sm">
          {castingSheet.map((role, i) => (
            <p key={i}>
              <span className="font-medium">{role.character}: </span>
              {role.description}
            </p>
          ))}
        </SectionContent>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Marketing</SectionTitle>
        </SectionHeader>
        <SectionContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Audience: </span>
            {marketingPlan.targetAudience}
          </p>
          <p>
            <span className="font-medium">Key messages: </span>
            {marketingPlan.keyMessages.join(" · ")}
          </p>
          <p>
            <span className="font-medium">Channels: </span>
            {marketingPlan.channels.join(", ")}
          </p>
          <p>
            <span className="font-medium">Poster concept: </span>
            {marketingPlan.posterConcept}
          </p>
          <p>
            <span className="font-medium">Trailer concept: </span>
            {marketingPlan.trailerConcept}
          </p>
          {filmStudioProjectId ? (
            <PosterImagePanel
              filmStudioProjectId={filmStudioProjectId}
              initialPosterImageUrl={posterImageUrl ?? null}
            />
          ) : (
            posterImageUrl && (
              <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-xl shadow-soft">
                <Image src={posterImageUrl} alt="Poster concept art" fill className="object-cover" unoptimized />
              </div>
            )
          )}
        </SectionContent>
      </SectionCard>
    </div>
  );
}
