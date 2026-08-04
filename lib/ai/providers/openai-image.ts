import OpenAI from "openai";
import type { ImageGenerateOptions, ImageGenerateResult, ImageProvider } from "../image-provider";
import { ImageProviderError } from "../image-provider";

const MODEL = "gpt-image-1";

const SIZE_MAP: Record<NonNullable<ImageGenerateOptions["size"]>, "1024x1024" | "1024x1536" | "1536x1024"> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

export class OpenAIImageProvider implements ImageProvider {
  readonly id = "openai";
  private client: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY ?? "") {
    if (!apiKey) {
      throw new ImageProviderError("openai", "OPENAI_API_KEY is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateImage(options: ImageGenerateOptions): Promise<ImageGenerateResult> {
    try {
      const response = await this.client.images.generate({
        model: MODEL,
        prompt: options.prompt,
        size: SIZE_MAP[options.size ?? "square"],
        n: 1,
      });

      const base64 = response.data?.[0]?.b64_json;
      if (!base64) {
        throw new Error("OpenAI did not return image data");
      }

      return { base64, mediaType: "image/png" };
    } catch (error) {
      throw new ImageProviderError("openai", "image generation failed", error);
    }
  }
}
