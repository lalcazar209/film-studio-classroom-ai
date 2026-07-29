import type { IntegrationProviderType } from "@prisma/client";
import type { SisAdapter } from "./sis-adapter";
import { InfiniteCampusAdapter } from "./infinite-campus";

const adapters: Partial<Record<IntegrationProviderType, () => SisAdapter>> = {
  INFINITE_CAMPUS: () => new InfiniteCampusAdapter(),
};

export function getSisAdapter(provider: IntegrationProviderType): SisAdapter {
  const factory = adapters[provider];
  if (!factory) {
    throw new Error(`No SIS integration adapter registered for provider "${provider}" yet`);
  }
  return factory();
}

export function listAvailableSisProviders(): IntegrationProviderType[] {
  return Object.keys(adapters) as IntegrationProviderType[];
}
