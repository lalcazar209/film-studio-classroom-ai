import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export type AIProviderId = "anthropic" | "openai" | "gemini";

const instances = new Map<AIProviderId, AIProvider>();

const factories: Record<AIProviderId, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
};

/** Lazily constructs and caches a provider so a missing API key for an
 * unused provider never blocks app startup. */
export function getAIProvider(id: AIProviderId = defaultProviderId()): AIProvider {
  const cached = instances.get(id);
  if (cached) return cached;

  const provider = factories[id]();
  instances.set(id, provider);
  return provider;
}

function defaultProviderId(): AIProviderId {
  const configured = process.env.DEFAULT_AI_PROVIDER as AIProviderId | undefined;
  return configured ?? "anthropic";
}
