import type {
  AssignmentPayload,
  CreatedAssignmentRef,
  IntegrationAdapter,
  IntegrationCredentials,
} from "./adapter";

/**
 * Canvas (Instructure) — standard OAuth2 authorization-code flow against
 * a Canvas instance's own domain (Canvas is typically self-hosted per
 * institution at https://<school>.instructure.com, so the base URL is
 * per-connection, not a single global host like Google's).
 */
export class CanvasAdapter implements IntegrationAdapter {
  readonly provider = "CANVAS" as const;

  constructor(private readonly baseUrl: string = process.env.CANVAS_BASE_URL ?? "") {
    if (!this.baseUrl) {
      throw new Error("CANVAS_BASE_URL is not set (e.g. https://yourschool.instructure.com)");
    }
  }

  async exchangeAuthCode(code: string, redirectUri: string): Promise<IntegrationCredentials> {
    const response = await fetch(`${this.baseUrl}/login/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.CANVAS_CLIENT_ID ?? "",
        client_secret: process.env.CANVAS_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Canvas token exchange failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("Cannot refresh Canvas credentials without a refresh token");
    }

    const response = await fetch(`${this.baseUrl}/login/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.CANVAS_CLIENT_ID ?? "",
        client_secret: process.env.CANVAS_CLIENT_SECRET ?? "",
        refresh_token: credentials.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Canvas token refresh failed: ${response.status}`);
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
    const response = await fetch(`${this.baseUrl}/api/v1/courses/${courseExternalId}/assignments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignment: {
          name: assignment.title,
          description: assignment.description,
          due_at: assignment.dueAt?.toISOString(),
          points_possible: assignment.maxPoints,
          published: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Canvas assignment creation failed: ${response.status}`);
    }

    const data = (await response.json()) as { id: number; html_url: string };
    return { externalId: String(data.id), url: data.html_url };
  }
}
