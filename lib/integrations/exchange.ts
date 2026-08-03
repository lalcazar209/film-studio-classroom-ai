import { google } from "googleapis";
import type { IntegrationProviderType } from "@prisma/client";
import type { IntegrationCredentials } from "./adapter";
import { getIntegrationAdapter, listAvailableProviders } from "./registry";
import { getVideoHostAdapter, listAvailableVideoHostProviders } from "./video-host-registry";

/**
 * Single entry point the OAuth callback route uses to turn an
 * authorization code into storable credentials, regardless of which of
 * the three adapter families (LMS, video host, or — for GOOGLE_WORKSPACE,
 * which isn't an LMS or a video host — a bare Google OAuth2 client) the
 * provider belongs to. Routes by registry membership rather than
 * try/catch, so a real exchange failure from the right adapter surfaces
 * as itself instead of being masked by a fallback attempt.
 */
export async function exchangeAuthCodeForProvider(
  provider: IntegrationProviderType,
  code: string,
  redirectUri: string,
): Promise<IntegrationCredentials> {
  if (provider === "GOOGLE_WORKSPACE") {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) {
      throw new Error("Google did not return an access token");
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };
  }

  if (listAvailableProviders().includes(provider)) {
    return getIntegrationAdapter(provider).exchangeAuthCode(code, redirectUri);
  }

  if (listAvailableVideoHostProviders().includes(provider)) {
    return getVideoHostAdapter(provider).exchangeAuthCode(code, redirectUri);
  }

  throw new Error(`No OAuth exchange is implemented for provider "${provider}"`);
}
