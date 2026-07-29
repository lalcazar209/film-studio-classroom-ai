import OpenAI from "openai";
import type { AIGenerateOptions, AIGenerateResult, AIProvider } from "../provider";
import { AIProviderError, toContentBlocks } from "../provider";

const DEFAULT_MODEL = "gpt-4.1";

function toOpenAIContent(
  content: Parameters<typeof toContentBlocks>[0],
): string | OpenAI.Chat.Completions.ChatCompletionContentPart[] {
  const blocks = toContentBlocks(content);
  if (blocks.every((b) => b.type === "text")) {
    return blocks.map((b) => (b as { text: string }).text).join("\n");
  }
  return blocks.map((block) =>
    block.type === "text"
      ? { type: "text" as const, text: block.text }
      : { type: "image_url" as const, image_url: { url: block.dataUri } },
  );
}

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
        messages: options.messages.map((m) => ({ role: m.role, content: toOpenAIContent(m.content) })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
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
