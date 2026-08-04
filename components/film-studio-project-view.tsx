import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PosterImagePanel } from "@/components/poster-image-panel";
import type {
  FilmStudioBundle,
} from "@/lib/ai/schemas";

type ScreenplayScene = FilmStudioBundle["screenplay"]["scenes"][number];
type ShotListEntry = FilmStudioBundle["shotList"]["shots"][number];

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
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-studio-accent">{genre}</p>
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-studio-ink/60 dark:text-white/60">{logline}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Screenplay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {screenplay.scenes.map((scene) => (
            <div key={scene.sceneNumber} className="border-b border-studio-ink/10 pb-3 last:border-0 dark:border-white/10">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shot list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {shotList.shots.map((shot) => (
            <p key={shot.number}>
              <span className="font-medium">
                #{shot.number} (Scene {shot.sceneNumber}, {shot.shotType}):{" "}
              </span>
              {shot.description} — {shot.lens}, {shot.movement}, ~{shot.durationSeconds}s
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call sheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
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
          <p className="text-studio-ink/60 dark:text-white/60">{callSheet.notes}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget — ${budget.totalEstimate.toLocaleString()} estimated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {budget.lineItems.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>
                {item.category} — {item.item}
              </span>
              <span>${item.estimatedCost.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {equipmentList.map((item, i) => (
            <p key={i}>
              {item.quantity}x {item.itemType}
              {item.notes ? ` — ${item.notes}` : ""}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {locationPlan.map((loc, i) => (
            <p key={i}>
              <span className="font-medium">{loc.name}</span>
              {loc.address ? ` — ${loc.address}` : ""} · {loc.notes}
              {loc.permitsNeeded && <span className="ml-2 text-amber-600 dark:text-amber-400">Permit needed</span>}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Casting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {castingSheet.map((role, i) => (
            <p key={i}>
              <span className="font-medium">{role.character}: </span>
              {role.description}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
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
        </CardContent>
      </Card>
    </div>
  );
}
