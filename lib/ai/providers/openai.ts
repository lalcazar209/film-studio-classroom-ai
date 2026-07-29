import OpenAI from "openai";
import type { AIGenerateOptions, AIGenerateResult, AIProvider } from "../provider";
import { AIProviderError } from "../provider";

const DEFAULT_MODEL = "gpt-4.1";

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  private client: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY ?? "") {
    if (!apiKey) {
      throw new AIProviderError("openai", "OPENAI_API_KEY is not set");
    }
    this.client = new OpenAI({ apiKey });
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        response_format: options.jsonSchema
          ? {
              type: "json_schema",
              json_schema: { name: "response", schema: options.jsonSchema, strict: true },
            }
          : undefined,
      });

      const choice = response.choices[0];
      const text = choice?.message?.content ?? "";

      return {
        text,
        raw: response,
        model: response.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (error) {
      throw new AIProviderError("openai", "generation failed", error);
    }
  }
}
