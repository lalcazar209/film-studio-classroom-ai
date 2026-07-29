import type {
  UploadVideoInput,
  UploadedVideoRef,
  VideoHostAdapter,
  VideoHostCredentials,
} from "./video-host-adapter";

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const API_BASE = "https://api.frame.io/v4";

/**
 * Frame.io — Adobe's video review/collaboration tool (Frame.io is part
 * of Creative Cloud since Adobe's acquisition, which is why this app
 * treats it as the practical "Adobe Creative Cloud" integration rather
 * than a separate one: Adobe's developer APIs are product-specific, and
 * Frame.io is the product that actually matches "share a cut for
 * review"). Auth goes through Adobe's shared Identity Management System
 * (IMS) OAuth2, not a Frame.io-specific auth server.
 */
export class FrameIoAdapter implements VideoHostAdapter {
  readonly provider = "FRAME_IO" as const;

  async exchangeAuthCode(code: string, redirectUri: string): Promise<VideoHostCredentials> {
    const response = await fetch(IMS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.ADOBE_CLIENT_ID ?? "",
        client_secret: process.env.ADOBE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Adobe IMS token exchange failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; refresh_token?: string; expires_in?: number };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshCredentials(credentials: VideoHostCredentials): Promise<VideoHostCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("Cannot refresh Frame.io/Adobe credentials without a refresh token");
    }

    const response = await fetch(IMS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.ADOBE_CLIENT_ID ?? "",
        client_secret: process.env.ADOBE_CLIENT_SECRET ?? "",
        refresh_token: credentials.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Adobe IMS token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in?: number };

    return {
      accessToken: data.access_token,
      refreshToken: credentials.refreshToken,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  /** Uploads to the account/workspace configured via FRAME_IO_ACCOUNT_ID /
   * FRAME_IO_ROOT_FOLDER_ID rather than requiring the caller to pass a
   * folder id — a school typically wants every submission landing in one
   * shared review project, not choosing a destination per upload. */
  async uploadVideo(credentials: VideoHostCredentials, input: UploadVideoInput): Promise<UploadedVideoRef> {
    const accountId = process.env.FRAME_IO_ACCOUNT_ID ?? "";
    const folderId = process.env.FRAME_IO_ROOT_FOLDER_ID ?? "";
    if (!accountId || !folderId) {
      throw new Error("FRAME_IO_ACCOUNT_ID and FRAME_IO_ROOT_FOLDER_ID must be configured");
    }

    const response = await fetch(`${API_BASE}/accounts/${accountId}/folders/${folderId}/files/remote_upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { name: input.title, source_url: input.sourceUrl } }),
    });

    if (!response.ok) {
      throw new Error(`Frame.io remote upload failed: ${response.status}`);
    }

    const data = (await response.json()) as { data: { id: string; view_url: string } };
    return { externalId: data.data.id, url: data.data.view_url };
  }
}
