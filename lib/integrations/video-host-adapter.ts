/**
 * Video hosting/review adapters — YouTube, Vimeo, Frame.io. Different
 * shape again from IntegrationAdapter: these publish or share a video
 * file, they don't manage courses/assignments. A student's demo reel or
 * a submitted project video is the thing being pushed out, not coursework
 * being pushed in.
 */

import type { IntegrationProviderType } from "@prisma/client";

export interface VideoHostCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface UploadVideoInput {
  title: string;
  description?: string;
  /** A URL our server can fetch the video bytes from (e.g. the Cloudinary secure_url). */
  sourceUrl: string;
  /** YouTube-style visibility; adapters that don't support a mode map to their closest equivalent. */
  visibility: "public" | "unlisted" | "private";
}

export interface UploadedVideoRef {
  externalId: string;
  url: string;
}

export interface VideoHostAdapter {
  readonly provider: IntegrationProviderType;

  exchangeAuthCode(code: string, redirectUri: string): Promise<VideoHostCredentials>;
  refreshCredentials(credentials: VideoHostCredentials): Promise<VideoHostCredentials>;
  uploadVideo(credentials: VideoHostCredentials, input: UploadVideoInput): Promise<UploadedVideoRef>;
}

export class VideoHostCapabilityError extends Error {
  constructor(provider: IntegrationProviderType, capability: string) {
    super(`${provider} adapter does not support "${capability}"`);
    this.name = "VideoHostCapabilityError";
  }
}
