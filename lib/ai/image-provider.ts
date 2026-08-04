/**
 * Provider-agnostic image-generation interface, parallel to provider.ts's
 * text AIProvider — a separate contract because image generation isn't a
 * capability every text provider has (Anthropic's Claude models don't
 * generate images at all), so it can't just be another method on
 * AIProvider without every implementation having to throw.
 */

export interface ImageGenerateOptions {
  prompt: string;
  /** "1024x1024" | "1024x1792" | "1792x1024" — provider-specific sizes are
   * normalized to the closest supported size by each implementation. */
  size?: "square" | "portrait" | "landscape";
}

export interface ImageGenerateResult {
  base64: string;
  mediaType: string;
}

export interface ImageProvider {
  readonly id: string;
  generateImage(options: ImageGenerateOptions): Promise<ImageGenerateResult>;
}

export class ImageProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`[${providerId}] ${message}`);
    this.name = "ImageProviderError";
  }
}
