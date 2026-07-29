import { google } from "googleapis";
import { Readable } from "node:stream";
import type {
  UploadVideoInput,
  UploadedVideoRef,
  VideoHostAdapter,
  VideoHostCredentials,
} from "./video-host-adapter";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

/** YouTube Data API v3. Reuses the same Google OAuth2 client shape as
 * google-classroom.ts (both are Google products), scoped to upload-only
 * so this integration can't read/manage a school's broader YouTube
 * presence. */
export class YouTubeAdapter implements VideoHostAdapter {
  readonly provider = "YOUTUBE" as const;

  static get authScopes() {
    return SCOPES;
  }

  private oauthClient(redirectUri?: string) {
    return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
  }

  async exchangeAuthCode(code: string, redirectUri: string): Promise<VideoHostCredentials> {
    const client = this.oauthClient(redirectUri);
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) {
      throw new Error("Google did not return an access token for YouTube upload scope");
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };
  }

  async refreshCredentials(credentials: VideoHostCredentials): Promise<VideoHostCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("Cannot refresh YouTube credentials without a refresh token");
    }
    const client = this.oauthClient();
    client.setCredentials({ refresh_token: credentials.refreshToken });
    const { credentials: refreshed } = await client.refreshAccessToken();
    if (!refreshed.access_token) {
      throw new Error("Google did not return a refreshed YouTube access token");
    }
    return {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? credentials.refreshToken,
      expiresAt: refreshed.expiry_date ? new Date(refreshed.expiry_date) : undefined,
    };
  }

  async uploadVideo(credentials: VideoHostCredentials, input: UploadVideoInput): Promise<UploadedVideoRef> {
    const client = this.oauthClient();
    client.setCredentials({ access_token: credentials.accessToken });
    const youtube = google.youtube({ version: "v3", auth: client });

    const sourceResponse = await fetch(input.sourceUrl);
    if (!sourceResponse.ok || !sourceResponse.body) {
      throw new Error(`Could not fetch source video from ${input.sourceUrl}`);
    }

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title: input.title, description: input.description },
        status: { privacyStatus: input.visibility },
      },
      media: { body: Readable.fromWeb(sourceResponse.body as never) },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new Error("YouTube did not return a video id after upload");
    }

    return { externalId: videoId, url: `https://www.youtube.com/watch?v=${videoId}` };
  }
}
