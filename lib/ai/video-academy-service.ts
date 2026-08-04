import { db } from "@/lib/db";
import { getAIProvider } from "./registry";
import { tutorialVideoBundleSchema, type TutorialVideoBundle } from "./schemas";
import { segmentsToSrt, segmentsToTranscript } from "@/lib/captions";
import { parseAIJson, AIJsonParseError, snippet } from "./json-parsing";
import type { TutorialCategory } from "@prisma/client";

export interface GenerateTutorialInput {
  topic: string;
  category: TutorialCategory;
  organizationId: string;
  createdById: string;
  notes?: string;
}

const SYSTEM_PROMPT = `You are the Video Academy content generator for Film Studio Classroom AI. Given
a film/TV production topic, produce a complete instructional video package: narration script broken
into timed segments, a visual guide and shot list for each segment, a teacher script for presenting
the same material live, a short hands-on practice activity, and an embedded quiz.

Segments should be realistic for a short instructional video (60-240 seconds total across all
segments), each segment 10-30 seconds. Narration should be spoken, conversational teaching language
appropriate for high school students, not a dry textbook description.

The JSON object must use exactly this shape — these top-level and nested field names, with no
renaming, additions, omissions, or extra wrapper objects (types shown for guidance only; fill in
real generated content):

{
  "title": "string",
  "topic": "string",
  "learningObjective": "string",
  "teacherScript": "string",
  "segments": [
    { "startSeconds": number, "endSeconds": number, "narration": "string", "visualGuide": "string", "shotType": "string", "graphicsNote": "string", "animationSuggestion": "string" }
  ] (at least 3 entries, endSeconds after startSeconds),
  "practiceActivity": { "title": "string", "instructions": "string", "estimatedMinutes": number },
  "quiz": {
    "title": "string",
    "questions": [{ "prompt": "string", "type": "multiple_choice" | "short_answer" | "true_false", "choices": ["string"], "answer": "string", "standardCode": "string" }]
  }
}

Respond with ONLY a single JSON object matching this exact shape. No prose, no markdown fences.`;

export async function generateTutorialVideo(input: GenerateTutorialInput) {
  const bundle = await requestBundle(input);
  return persistBundle(input, bundle);
}

async function requestBundle(input: GenerateTutorialInput, attempt = 1): Promise<TutorialVideoBundle> {
  const provider = getAIProvider();

  const userPrompt = [
    `Topic: ${input.topic}`,
    `Category: ${input.category}`,
    input.notes ? `Additional notes from the teacher: ${input.notes}` : null,
    "",
    "Generate the complete tutorial video package now as raw JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await provider.generate({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 4096,
    temperature: 0.6,
  });

  let parsed: unknown;
  try {
    parsed = parseAIJson(result.text);
  } catch (error) {
    if (attempt >= 3) {
      const reason = error instanceof AIJsonParseError ? error.message : String(error);
      throw new Error(`Video Academy generation produced invalid output after ${attempt} attempts: ${reason}`);
    }
    return requestBundle(input, attempt + 1);
  }

  const validated = tutorialVideoBundleSchema.safeParse(parsed);

  if (!validated.success) {
    if (attempt >= 3) {
      throw new Error(`Video Academy generation produced invalid output after ${attempt} attempts: ${validated.error.message}`, {
        cause: new Error(`Raw model response: ${snippet(result.text)}`),
      });
    }
    return requestBundle(input, attempt + 1);
  }

  return validated.data;
}

async function persistBundle(input: GenerateTutorialInput, bundle: TutorialVideoBundle) {
  return db.tutorialVideo.create({
    data: {
      organizationId: input.organizationId,
      createdById: input.createdById,
      title: bundle.title,
      topic: bundle.topic,
      category: input.category,
      learningObjective: bundle.learningObjective,
      teacherScript: bundle.teacherScript,
      segments: bundle.segments,
      practiceActivity: bundle.practiceActivity,
      quiz: bundle.quiz,
      transcript: segmentsToTranscript(bundle.segments),
      captionsSrt: segmentsToSrt(bundle.segments),
    },
  });
}
