import Anthropic from "@anthropic-ai/sdk";
import type { AIGenerateOptions, AIGenerateResult, AIProvider } from "../provider";
import { AIProviderError, toContentBlocks, parseDataUri } from "../provider";

const DEFAULT_MODEL = "claude-sonnet-5";

function toAnthropicContent(
  content: Parameters<typeof toContentBlocks>[0],
): Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> {
  return toContentBlocks(content).map((block) =>
    block.type === "text"
      ? { type: "text", text: block.text }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: parseDataUri(block.dataUri).mediaType as "image/jpeg" | "image/png" | "image/webp",
            data: parseDataUri(block.dataUri).base64,
          },
        },
  );
}

function textOnly(content: Parameters<typeof toContentBlocks>[0]): string {
  return toContentBlocks(content)
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

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
    const systemMessage = options.messages.find((m) => m.role === "system");
    const system = systemMessage ? textOnly(systemMessage.content) : undefined;
    const conversation = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: toAnthropicContent(m.content) }));

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
