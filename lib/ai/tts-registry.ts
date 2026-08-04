import type { TTSProvider } from "./tts-provider";
import { OpenAITTSProvider } from "./providers/openai-tts";

export type TTSProviderId = "openai";

const instances = new Map<TTSProviderId, TTSProvider>();

const factories: Record<TTSProviderId, () => TTSProvider> = {
  openai: () => new OpenAITTSProvider(),
};

/** Lazily constructs and caches a provider so a missing API key never
 * blocks app startup — mirrors lib/ai/image-registry.ts's getImageProvider. */
export function getTTSProvider(id: TTSProviderId = "openai"): TTSProvider {
  const cached = instances.get(id);
  if (cached) return cached;

  const provider = factories[id]();
  instances.set(id, provider);
  return provider;
}
