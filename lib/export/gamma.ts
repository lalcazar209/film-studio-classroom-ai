/**
 * Gamma's public Generate API: submit an outline as text, poll until the
 * generation finishes, get back a shareable Gamma URL. Async by design —
 * generation takes tens of seconds, so callers get a generationId back
 * immediately and poll rather than blocking a request for the whole time.
 *
 * Verify the endpoint path/version (currently v0.2) against Gamma's
 * current API docs before deploying — like any third-party API, this can
 * change.
 */

const API_BASE = "https://public-api.gamma.app/v0.2";

export class GammaError extends Error {}

function apiKey(): string {
  const key = process.env.GAMMA_API_KEY;
  if (!key) throw new GammaError("GAMMA_API_KEY is not set");
  return key;
}

/** A non-ok response's body (Gamma's actual rejection reason — invalid
 * key, wrong plan, bad payload shape, etc.) is far more diagnosable than
 * the bare HTTP status code alone, and this integration has never been
 * verified against a live Gamma account. */
async function responseBodySnippet(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return "";
  return text.length > 500 ? `— ${text.slice(0, 500)}…` : `— ${text}`;
}

export interface GammaGenerateInput {
  title: string;
  /** Outline text — one line/paragraph per intended card/slide. Gamma expands this into a full designed presentation. */
  outline: string;
}

export async function startGammaGeneration(input: GammaGenerateInput): Promise<{ generationId: string }> {
  const response = await fetch(`${API_BASE}/generations`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputText: `${input.title}\n\n${input.outline}`,
      textMode: "preserve",
      format: "presentation",
    }),
  });

  if (!response.ok) {
    throw new GammaError(`Gamma generation request failed: ${response.status} ${await responseBodySnippet(response)}`);
  }

  const data = (await response.json()) as { generationId: string };
  return { generationId: data.generationId };
}

export interface GammaGenerationStatus {
  status: "pending" | "completed" | "failed";
  gammaUrl?: string;
}

export async function getGammaGenerationStatus(generationId: string): Promise<GammaGenerationStatus> {
  const response = await fetch(`${API_BASE}/generations/${generationId}`, {
    headers: { "X-API-KEY": apiKey() },
  });

  if (!response.ok) {
    throw new GammaError(`Gamma generation status check failed: ${response.status} ${await responseBodySnippet(response)}`);
  }

  return (await response.json()) as GammaGenerationStatus;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

/** Polls until Gamma finishes or the attempt budget runs out — call this
 * from a background job/route, not inline in a request a user is
 * actively waiting on for more than a couple of polls. */
export async function generateGammaAndWait(input: GammaGenerateInput): Promise<string> {
  const { generationId } = await startGammaGeneration(input);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const status = await getGammaGenerationStatus(generationId);
    if (status.status === "completed" && status.gammaUrl) {
      return status.gammaUrl;
    }
    if (status.status === "failed") {
      throw new GammaError("Gamma generation failed");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new GammaError("Gamma generation timed out");
}

export function buildProjectOutline(input: {
  title: string;
  brief: string;
  lessons: Array<{ dayLabel: string; title: string; objective: string }>;
}): string {
  const lines = [input.brief, ""];
  for (const lesson of input.lessons) {
    lines.push(`${lesson.dayLabel}: ${lesson.title}`, lesson.objective, "");
  }
  return lines.join("\n");
}

export function buildTutorialOutline(input: {
  learningObjective: string;
  segments: Array<{ narration: string }>;
}): string {
  return [input.learningObjective, "", ...input.segments.map((s) => s.narration)].join("\n");
}
