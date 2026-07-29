import { google } from "googleapis";
import type {
  AssignmentPayload,
  CreatedAssignmentRef,
  IntegrationAdapter,
  IntegrationCredentials,
} from "./adapter";

const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students",
];

export class GoogleClassroomAdapter implements IntegrationAdapter {
  readonly provider = "GOOGLE_CLASSROOM" as const;

  private oauthClient(redirectUri?: string) {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );
  }

  static get authScopes() {
    return SCOPES;
  }

  async exchangeAuthCode(code: string, redirectUri: string): Promise<IntegrationCredentials> {
    const client = this.oauthClient(redirectUri);
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

  async refreshCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("Cannot refresh Google Classroom credentials without a refresh token");
    }

    const client = this.oauthClient();
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

  async createAssignment(
    credentials: IntegrationCredentials,
    courseExternalId: string,
    assignment: AssignmentPayload,
  ): Promise<CreatedAssignmentRef> {
    const client = this.oauthClient();
    client.setCredentials({ access_token: credentials.accessToken });
    const classroom = google.classroom({ version: "v1", auth: client });

    const response = await classroom.courses.courseWork.create({
      courseId: courseExternalId,
      requestBody: {
        title: assignment.title,
        description: assignment.description,
        workType: "ASSIGNMENT",
        state: "PUBLISHED",
        maxPoints: assignment.maxPoints,
        dueDate: assignment.dueAt
          ? {
              year: assignment.dueAt.getFullYear(),
              month: assignment.dueAt.getMonth() + 1,
              day: assignment.dueAt.getDate(),
            }
          : undefined,
        materials: assignment.attachmentUrls?.map((url) => ({ link: { url } })),
      },
    });

    const { id, alternateLink } = response.data;
    if (!id || !alternateLink) {
      throw new Error("Google Classroom did not return the created courseWork reference");
    }

    return { externalId: id, url: alternateLink };
  }
}
