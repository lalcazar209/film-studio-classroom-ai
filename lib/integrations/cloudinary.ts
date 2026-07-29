import { v2 as cloudinary } from "cloudinary";

export class CloudinaryError extends Error {}

function assertConfigured() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new CloudinaryError(
      "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)",
    );
  }
}

/**
 * Signs an upload request so the browser can upload the video file directly
 * to Cloudinary — the video bytes never pass through our server/serverless
 * function, avoiding Next.js API route body-size limits entirely.
 */
export function createSignedUploadParams(input: { folder: string; publicId: string }) {
  assertConfigured();

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: input.folder, public_id: input.publicId };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder: input.folder,
    publicId: input.publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
  };
}

/**
 * Cloudinary generates video-frame thumbnails on the fly via URL
 * transformation — no separate extraction job needed. Returns null for
 * non-Cloudinary URLs (e.g. a student pasted a YouTube link instead of
 * uploading), since we can't manipulate frames we don't host.
 */
export function getVideoThumbnailUrls(secureUrl: string, offsetsSeconds: number[]): string[] | null {
  const match = secureUrl.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload)\/(.+)\.[a-z0-9]+$/i);
  if (!match) return null;

  const [, base, pathWithoutExt] = match;
  return offsetsSeconds.map((seconds) => `${base}/so_${seconds},f_jpg/${pathWithoutExt}.jpg`);
}
