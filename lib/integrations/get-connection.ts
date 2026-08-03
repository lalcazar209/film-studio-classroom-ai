import { google } from "googleapis";
import { db } from "@/lib/db";
import type { IntegrationCredentials } from "./adapter";
import type { IntegrationProviderType } from "@prisma/client";

async function refreshGoogleCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
  if (!credentials.refreshToken) {
    throw new Error("Cannot refresh Google credentials without a refresh token");
  }
  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: credentials.refreshToken });
  const { credentials: refreshed } = await client.refreshAccessToken();
  if (!refreshed.access_token) {
    throw new Error("Google did not return a refreshed access token");
  }
  return {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? credentials.refreshToken,
    expiresAt: refreshed.expiry_date ? new Date(refreshed.expiry_date) : undefined,
  };
}

/**
 * Loads a stored IntegrationConnection as usable credentials, refreshing
 * the access token first if it's expired (or about to be) and persisting
 * the refreshed token back — every route that calls out to a connected
 * Google provider needs this same "is it still valid, refresh if not"
 * step, whether or not that provider has its own adapter class.
 */
async function getGoogleCredentials(
  organizationId: string,
  provider: IntegrationProviderType,
): Promise<IntegrationCredentials | null> {
  const connection = await db.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider } },
  });
  if (!connection?.accessToken) return null;

  let credentials: IntegrationCredentials = {
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken ?? undefined,
    expiresAt: connection.expiresAt ?? undefined,
  };

  const isExpiringSoon = credentials.expiresAt && credentials.expiresAt.getTime() < Date.now() + 60_000;
  if (isExpiringSoon && credentials.refreshToken) {
    credentials = await refreshGoogleCredentials(credentials);
    await db.integrationConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
      },
    });
  }

  return credentials;
}

export function getGoogleClassroomCredentials(organizationId: string) {
  return getGoogleCredentials(organizationId, "GOOGLE_CLASSROOM" as IntegrationProviderType);
}

export function getGoogleWorkspaceCredentials(organizationId: string) {
  return getGoogleCredentials(organizationId, "GOOGLE_WORKSPACE" as IntegrationProviderType);
}
