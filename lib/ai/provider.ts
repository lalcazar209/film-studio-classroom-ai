/**
 * Provider-agnostic AI interface. Every AI Assistant (Director AI, Editor AI,
 * Career Coach, etc.) and the curriculum engine call through this contract so
 * the underlying model (Anthropic, OpenAI, Gemini) can be swapped per
 * deployment without touching feature code.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
