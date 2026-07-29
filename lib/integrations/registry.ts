import type { IntegrationProviderType } from "@prisma/client";
import type { IntegrationAdapter } from "./adapter";
import { GoogleClassroomAdapter } from "./google-classroom";

/**
 * Enabled adapters. Providers listed in the project brief without an entry
 * here (Canvas, Schoology, Blackboard, Adobe CC, YouTube, Zapier, ...) are
 * planned but not yet implemented — see ROADMAP.md Phase 10.
 */
const adapters: Partial<Record<IntegrationProviderType, () => IntegrationAdapter>> = {
  GOOGLE_CLASSROOM: () => new GoogleClassroomAdapter(),
};

export function getIntegrationAdapter(provider: IntegrationProviderType): IntegrationAdapter {
  const factory = adapters[provider];
  if (!factory) {
    throw new Error(`No integration adapter registered for provider "${provider}" yet`);
  }
  return factory();
}

export function listAvailableProviders(): IntegrationProviderType[] {
  return Object.keys(adapters) as IntegrationProviderType[];
}
