/**
 * Extracts and parses a JSON object/array from an AI model's raw text
 * response. Every AI generation service asks the model to "respond with
 * ONLY a single JSON object, no prose, no markdown fences" — but models
 * don't always comply exactly, so this strips fences and, if the whole
 * trimmed string still doesn't parse, falls back to slicing between the
 * first `{`/`[` and the last matching `}`/`]` to recover JSON embedded in
 * stray commentary.
 *
 * Throws AIJsonParseError (with a snippet of the raw text attached)
 * rather than ever silently returning `{}` on failure — an earlier
 * version of this helper, duplicated with that bug across six service
 * files, made every downstream Zod validation failure look identical
 * ("every field is required") regardless of the actual cause, which is
 * exactly what made a real production failure (a truncated response,
 * caught by `maxTokens` being too low for a large schema) impossible to
 * diagnose from the error message alone.
 */
export class AIJsonParseError extends Error {
  constructor(
    message: string,
    public readonly rawText: string,
  ) {
    super(message);
    this.name = "AIJsonParseError";
  }
}

/**
 * Truncates raw AI response text for safe inclusion in error messages/logs.
 * Exported so services can attach "what the model actually returned" to a
 * Zod validation failure — parseAIJson succeeding but the result not
 * matching the schema (e.g. the model nested the bundle under a wrapper
 * key) is a different failure mode than malformed JSON, and needs the same
 * raw-text visibility to diagnose.
 */
export function snippet(text: string, maxLength = 800): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function parseAIJson(text: string): unknown {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // Fall through to the bracket-slicing recovery below.
  }

  const firstBrace = stripped.search(/[{[]/);
  const lastBrace = Math.max(stripped.lastIndexOf("}"), stripped.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(stripped.slice(firstBrace, lastBrace + 1));
    } catch {
      // Fall through to the error below.
    }
  }

  throw new AIJsonParseError(`Model response was not valid JSON. Raw response: ${snippet(text)}`, text);
}
