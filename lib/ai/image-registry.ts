import type { ImageProvider } from "./image-provider";
import { OpenAIImageProvider } from "./providers/openai-image";

export type ImageProviderId = "openai";

const instances = new Map<ImageProviderId, ImageProvider>();

const factories: Record<ImageProviderId, () => ImageProvider> = {
  openai: () => new OpenAIImageProvider(),
};

/** Lazily constructs and caches a provider so a missing API key never
 * blocks app startup — mirrors lib/ai/registry.ts's getAIProvider. */
export function getImageProvider(id: ImageProviderId = "openai"): ImageProvider {
  const cached = instances.get(id);
  if (cached) return cached;

  const provider = factories[id]();
  instances.set(id, provider);
  return provider;
}
