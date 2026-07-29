import type { IntegrationProviderType } from "@prisma/client";
import type { VideoHostAdapter } from "./video-host-adapter";
import { YouTubeAdapter } from "./youtube";
import { VimeoAdapter } from "./vimeo";
import { FrameIoAdapter } from "./frameio";

const adapters: Partial<Record<IntegrationProviderType, () => VideoHostAdapter>> = {
  YOUTUBE: () => new YouTubeAdapter(),
  VIMEO: () => new VimeoAdapter(),
  FRAME_IO: () => new FrameIoAdapter(),
};

export function getVideoHostAdapter(provider: IntegrationProviderType): VideoHostAdapter {
  const factory = adapters[provider];
  if (!factory) {
    throw new Error(`No video host integration adapter registered for provider "${provider}" yet`);
  }
  return factory();
}

export function listAvailableVideoHostProviders(): IntegrationProviderType[] {
  return Object.keys(adapters) as IntegrationProviderType[];
}
