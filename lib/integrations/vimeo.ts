import type {
  UploadVideoInput,
  UploadedVideoRef,
  VideoHostAdapter,
  VideoHostCredentials,
} from "./video-host-adapter";

const API_BASE = "https://api.vimeo.com";

/** Vimeo API v3, OAuth2. Uses Vimeo's "pull" upload approach — we give
 * Vimeo a URL it can fetch the video from (the Cloudinary secure_url)
 * instead of streaming bytes through our own server, since we already
 * have a publicly fetchable source. */
export class VimeoAdapter implements VideoHostAdapter {
  readonly provider = "VIMEO" as const;

  async exchangeAuthCode(code: string, redirectUri: string): Promise<VideoHostCredentials> {
    const response = await fetch(`${API_BASE}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.VIMEO_CLIENT_ID ?? ""}:${process.env.VIMEO_CLIENT_SECRET ?? ""}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vimeo token exchange failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string };
    // Vimeo access tokens for the "authorization_code" grant don't expire
    // and there's no refresh token — the connection stays valid until the
    // user revokes it.
    return { accessToken: data.access_token };
  }

  async refreshCredentials(credentials: VideoHostCredentials): Promise<VideoHostCredentials> {
    return credentials;
  }

  async uploadVideo(credentials: VideoHostCredentials, input: UploadVideoInput): Promise<UploadedVideoRef> {
    const response = await fetch(`${API_BASE}/me/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
      body: JSON.stringify({
        upload: { approach: "pull", link: input.sourceUrl },
        name: input.title,
        description: input.description,
        privacy: { view: input.visibility === "public" ? "anybody" : input.visibility === "unlisted" ? "unlisted" : "nobody" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Vimeo upload creation failed: ${response.status}`);
    }

    const data = (await response.json()) as { uri: string; link: string };
    const videoId = data.uri.split("/").pop() ?? data.uri;

    return { externalId: videoId, url: data.link };
  }
}
