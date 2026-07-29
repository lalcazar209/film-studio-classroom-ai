/**
 * Third-party integration adapter framework. Every external service
 * (Google Classroom, Canvas, Schoology, Adobe CC, YouTube, Zapier, ...)
 * implements this interface so core application logic never depends on a
 * specific vendor SDK. Adapters are registered in `registry.ts` and looked
 * up by `IntegrationProviderType` at call time.
 */

import type { IntegrationProviderType } from "@prisma/client";

export interface IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface AssignmentPayload {
  title: string;
  description: string;
  dueAt?: Date;
  attachmentUrls?: string[];
  maxPoints?: number;
}

export interface CreatedAssignmentRef {
  externalId: string;
  url: string;
}

/**
 * Minimal contract every LMS-style adapter must satisfy. Adapters that
 * don't support a capability (e.g. a storage-only provider) should throw
 * `IntegrationCapabilityError` rather than silently no-op.
 */
export interface IntegrationAdapter {
  readonly provider: IntegrationProviderType;

  /** Exchange an OAuth authorization code for storable credentials. */
  exchangeAuthCode(code: string, redirectUri: string): Promise<IntegrationCredentials>;

  /** Refresh an expired access token. */
  refreshCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials>;

  /** Push a generated project/lesson as an assignment in the external system. */
  createAssignment(
    credentials: IntegrationCredentials,
    courseExternalId: string,
    assignment: AssignmentPayload,
  ): Promise<CreatedAssignmentRef>;
}

export class IntegrationCapabilityError extends Error {
  constructor(provider: IntegrationProviderType, capability: string) {
    super(`${provider} adapter does not support "${capability}"`);
    this.name = "IntegrationCapabilityError";
  }
}
