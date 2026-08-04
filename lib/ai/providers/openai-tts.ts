import OpenAI from "openai";
import type { TTSGenerateOptions, TTSGenerateResult, TTSProvider } from "../tts-provider";
import { TTSProviderError } from "../tts-provider";

const MODEL = "tts-1";
const VOICE = "alloy";

export class OpenAITTSProvider implements TTSProvider {
  readonly id = "openai";
  private client: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY ?? "") {
    if (!apiKey) {
      throw new TTSProviderError("openai", "OPENAI_API_KEY is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  async synthesizeSpeech(options: TTSGenerateOptions): Promise<TTSGenerateResult> {
    try {
      const response = await this.client.audio.speech.create({
        model: MODEL,
        voice: VOICE,
        input: options.text,
        response_format: "mp3",
      });

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return { base64, mediaType: "audio/mpeg" };
    } catch (error) {
      throw new TTSProviderError("openai", "speech synthesis failed", error);
    }
  }
}
