/**
 * Provider-agnostic text-to-speech interface, parallel to image-provider.ts's
 * ImageProvider — narration audio isn't a capability every text provider
 * has, so it can't just be another method on AIProvider.
 */

export interface TTSGenerateOptions {
  text: string;
}

export interface TTSGenerateResult {
  base64: string;
  mediaType: string;
}

export interface TTSProvider {
  readonly id: string;
  synthesizeSpeech(options: TTSGenerateOptions): Promise<TTSGenerateResult>;
}

export class TTSProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`[${providerId}] ${message}`);
    this.name = "TTSProviderError";
  }
}
