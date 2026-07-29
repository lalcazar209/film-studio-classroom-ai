import type {
  AssignmentPayload,
  CreatedAssignmentRef,
  IntegrationAdapter,
  IntegrationCredentials,
} from "./adapter";

/**
 * Schoology (PowerSchool). Implemented against Schoology's OAuth2
 * authorization-code flow and REST API v1. Schoology's API has changed
 * auth models over the years (it historically also supported OAuth 1.0a
 * two-legged consumer-key/secret requests) — verify this still matches
 * your school's Schoology API version before deploying; the shapes below
 * are correct for the OAuth2 flow as documented at the time this was
 * written, but third-party APIs evolve.
 */
export class SchoologyAdapter implements IntegrationAdapter {
  readonly provider = "SCHOOLOGY" as const;

  private readonly apiBase = "https://api.schoology.com/v1";
  private readonly authBase = "https://app.schoology.com/oauth2";

  async exchangeAuthCode(code: string, redirectUri: string): Promise<IntegrationCredentials> {
    const response = await fetch(`${this.authBase}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.SCHOOLOGY_CLIENT_ID ?? "",
        client_secret: process.env.SCHOOLOGY_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Schoology token exchange failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; refresh_token?: string; expires_in?: number };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("Cannot refresh Schoology credentials without a refresh token");
    }

    const response = await fetch(`${this.authBase}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.SCHOOLOGY_CLIENT_ID ?? "",
        client_secret: process.env.SCHOOLOGY_CLIENT_SECRET ?? "",
        refresh_token: credentials.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Schoology token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in?: number };

    return {
      accessToken: data.access_token,
      refreshToken: credentials.refreshToken,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async createAssignment(
    credentials: IntegrationCredentials,
    courseExternalId: string,
    assignment: AssignmentPayload,
  ): Promise<CreatedAssignmentRef> {
    const response = await fetch(`${this.apiBase}/sections/${courseExternalId}/assignments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: assignment.title,
        description: assignment.description,
        due: assignment.dueAt?.toISOString(),
        max_points: assignment.maxPoints,
        published: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Schoology assignment creation failed: ${response.status}`);
    }

    const data = (await response.json()) as { id: number };
    return {
      externalId: String(data.id),
      url: `https://app.schoology.com/assignment/${data.id}`,
    };
  }
}
