/** Fetches an image (e.g. a Cloudinary-generated video-frame thumbnail)
 * and returns it as a base64 data URI so it can be attached to an
 * AIMessage regardless of which provider's image-input format is used. */
export async function fetchImageAsDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image at ${url}: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
