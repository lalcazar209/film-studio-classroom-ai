import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { filmStudioBundleSchema, type FilmStudioBundle } from "./schemas";
import { parseAIJson, AIJsonParseError } from "./json-parsing";

export interface GenerateFilmStudioInput {
  concept: string;
  genre: string;
  organizationId: string;
  createdById: string;
  castSize?: number;
  shootDays?: number;
}

const SYSTEM_PROMPT = `You are the AI Film Studio for Film Studio Classroom AI — a production-planning
generator for student film/TV productions. Given a concept, produce a complete, internally
consistent production package: a real (if short) screenplay with proper slugline formatting,
a shot list that could actually be shot in the estimated schedule, a realistic call sheet, a
student-appropriate budget (assume access to school equipment is free; budget for consumables,
permits, and anything that must be rented or bought), an equipment list, a location plan noting
which locations realistically need permits, a casting sheet, and a marketing plan including a
poster concept and trailer concept described in prose (this system does not generate images).

Keep scope realistic for a student production: a short film (5-15 pages), a small cast, and a
schedule of 1-3 shoot days unless told otherwise. Every scene in shotList.shots must reference a
sceneNumber that exists in screenplay.scenes.

Respond with ONLY a single JSON object matching the required schema. No prose, no markdown fences.`;

export async function generateFilmStudioProject(input: GenerateFilmStudioInput) {
  const bundle = await requestBundle(input);
  return persistBundle(input, bundle);
}

async function requestBundle(input: GenerateFilmStudioInput, attempt = 1): Promise<FilmStudioBundle> {
  const provider = getAIProvider();

  const userPrompt = [
    `Concept: ${input.concept}`,
    `Genre: ${input.genre}`,
    input.castSize ? `Target cast size: ${input.castSize}` : null,
    input.shootDays ? `Target shoot days: ${input.shootDays}` : null,
    "",
    "Generate the complete AI Film Studio production package now as raw JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await provider.generate({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    // A full production package (screenplay + shot list + call sheet +
    // budget + equipment + locations + casting + marketing) is as large
    // a schema as the curriculum builder's — 8192 was tight enough to
    // truncate the response mid-JSON in production.
    maxTokens: 16384,
    temperature: 0.7,
  });

  let parsed: unknown;
  try {
    parsed = parseAIJson(result.text);
  } catch (error) {
    if (attempt >= 3) {
      const reason = error instanceof AIJsonParseError ? error.message : String(error);
      throw new Error(`AI Film Studio generation produced invalid output after ${attempt} attempts: ${reason}`);
    }
    return requestBundle(input, attempt + 1);
  }

  const validated = filmStudioBundleSchema.safeParse(parsed);

  if (!validated.success) {
    if (attempt >= 3) {
      throw new Error(`AI Film Studio generation produced invalid output after ${attempt} attempts: ${validated.error.message}`);
    }
    return requestBundle(input, attempt + 1);
  }

  return validated.data;
}

async function persistBundle(input: GenerateFilmStudioInput, bundle: FilmStudioBundle) {
  return db.filmStudioProject.create({
    data: {
      organizationId: input.organizationId,
      createdById: input.createdById,
      title: bundle.title,
      logline: bundle.logline,
      genre: bundle.genre,
      screenplay: bundle.screenplay,
      shotList: bundle.shotList,
      callSheet: bundle.callSheet,
      budget: bundle.budget,
      equipmentList: bundle.equipmentList,
      locationPlan: bundle.locationPlan,
      castingSheet: bundle.castingSheet,
      marketingPlan: bundle.marketingPlan,
    },
  });
}
