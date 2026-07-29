/**
 * Provider-agnostic AI interface. Every AI Assistant (Director AI, Editor AI,
 * Career Coach, etc.) and the curriculum engine call through this contract so
 * the underlying model (Anthropic, OpenAI, Gemini) can be swapped per
 * deployment without touching feature code.
 */

export type AIContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; dataUri: string };

export interface AIMessage {
  role: "system" | "user" | "assistant";
  /** A plain string is shorthand for a single text block. */
  content: string | AIContentBlock[];
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  /** JSON Schema the response must conform to. When set, the provider must return valid JSON matching it. */
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResult {
  text: string;
  raw: unknown;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface AIProvider {
  readonly id: string;
  generate(options: AIGenerateOptions): Promise<AIGenerateResult>;
}

export class AIProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`[${providerId}] ${message}`);
    this.name = "AIProviderError";
  }
}

export function toContentBlocks(content: string | AIContentBlock[]): AIContentBlock[] {
  return typeof content === "string" ? [{ type: "text", text: content }] : content;
}

const DATA_URI_PATTERN = /^data:([^;]+);base64,(.+)$/;

export function parseDataUri(dataUri: string): { mediaType: string; base64: string } {
  const match = dataUri.match(DATA_URI_PATTERN);
  if (!match) {
    throw new Error("Expected a base64 data URI (data:<mime>;base64,<data>)");
  }
  const [, mediaType, base64] = match;
  return { mediaType: mediaType!, base64: base64! };
}
