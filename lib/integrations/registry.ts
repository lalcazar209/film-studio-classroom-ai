import type { IntegrationProviderType } from "@prisma/client";
import type { IntegrationAdapter } from "./adapter";
import { GoogleClassroomAdapter } from "./google-classroom";
import { CanvasAdapter } from "./canvas";
import { SchoologyAdapter } from "./schoology";
import { BlackboardAdapter } from "./blackboard";

/**
 * Enabled LMS adapters (IntegrationAdapter shape). See sis-registry.ts for
 * Infinite Campus (a Student Information System, not an LMS) and
 * video-host-registry.ts for YouTube/Vimeo/Frame.io.
 */
const adapters: Partial<Record<IntegrationProviderType, () => IntegrationAdapter>> = {
  GOOGLE_CLASSROOM: () => new GoogleClassroomAdapter(),
  CANVAS: () => new CanvasAdapter(),
  SCHOOLOGY: () => new SchoologyAdapter(),
  BLACKBOARD: () => new BlackboardAdapter(),
};

export function getIntegrationAdapter(provider: IntegrationProviderType): IntegrationAdapter {
  const factory = adapters[provider];
  if (!factory) {
    throw new Error(`No LMS integration adapter registered for provider "${provider}" yet`);
  }
  return factory();
}

export function listAvailableProviders(): IntegrationProviderType[] {
  return Object.keys(adapters) as IntegrationProviderType[];
}
