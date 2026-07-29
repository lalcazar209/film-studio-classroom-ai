import Anthropic from "@anthropic-ai/sdk";
import type { AIGenerateOptions, AIGenerateResult, AIProvider } from "../provider";
import { AIProviderError } from "../provider";

const DEFAULT_MODEL = "claude-sonnet-4-5";

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? "") {
    if (!apiKey) {
      throw new AIProviderError("anthropic", "ANTHROPIC_API_KEY is not set");
    }
    this.client = new Anthropic({ apiKey });
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const system = options.messages.find((m) => m.role === "system")?.content;
    const conversation = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const response = await this.client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        system,
        messages: conversation,
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return {
        text,
        raw: response,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new AIProviderError("anthropic", "generation failed", error);
    }
  }
}
