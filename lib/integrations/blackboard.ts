import type {
  AssignmentPayload,
  CreatedAssignmentRef,
  IntegrationAdapter,
  IntegrationCredentials,
} from "./adapter";

/**
 * Blackboard Learn REST API, OAuth2 authorization-code flow. Like Canvas,
 * Blackboard Learn is self-hosted per institution, so `baseUrl` is a
 * per-connection value (the school's own Learn domain), not global.
 * Content is created as a course "content item" rather than a distinct
 * "assignment" resource — Learn's content tree doesn't separate the two
 * the way Canvas/Schoology do.
 */
export class BlackboardAdapter implements IntegrationAdapter {
  readonly provider = "BLACKBOARD" as const;

  constructor(private readonly baseUrl: string = process.env.BLACKBOARD_BASE_URL ?? "") {
    if (!this.baseUrl) {
      throw new Error("BLACKBOARD_BASE_URL is not set (e.g. https://yourschool.blackboard.com)");
    }
  }

  async exchangeAuthCode(code: string, redirectUri: string): Promise<IntegrationCredentials> {
    const response = await this.tokenRequest({
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    const data = (await response.json()) as { access_token: string; refresh_token?: string; expires_in?: number };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("Cannot refresh Blackboard credentials without a refresh token");
    }

    const response = await this.tokenRequest({
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    });

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
    const response = await fetch(`${this.baseUrl}/learn/api/public/v1/courses/${courseExternalId}/contents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: assignment.title,
        body: assignment.description,
        availability: { available: "Yes" },
        contentHandler: { id: "resource/x-bb-assignment" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Blackboard content creation failed: ${response.status}`);
    }

    const data = (await response.json()) as { id: string };
    return {
      externalId: data.id,
      url: `${this.baseUrl}/ultra/courses/${courseExternalId}/outline/edit/document/${data.id}`,
    };
  }

  /** Blackboard's token endpoint authenticates the app itself via HTTP
   * Basic auth (app key/secret), separate from the user-level tokens the
   * endpoint returns. */
  private async tokenRequest(body: Record<string, string>): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/learn/api/public/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.BLACKBOARD_APP_KEY ?? ""}:${process.env.BLACKBOARD_APP_SECRET ?? ""}`).toString("base64")}`,
      },
      body: new URLSearchParams(body),
    });
    if (!response.ok) {
      throw new Error(`Blackboard token request failed: ${response.status}`);
    }
    return response;
  }
}
