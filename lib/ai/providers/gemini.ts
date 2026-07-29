import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { AIGenerateOptions, AIGenerateResult, AIProvider } from "../provider";
import { AIProviderError, toContentBlocks, parseDataUri } from "../provider";

const DEFAULT_MODEL = "gemini-2.0-flash";

function toGeminiParts(content: Parameters<typeof toContentBlocks>[0]): Part[] {
  return toContentBlocks(content).map((block) =>
    block.type === "text"
      ? { text: block.text }
      : { inlineData: { mimeType: parseDataUri(block.dataUri).mediaType, data: parseDataUri(block.dataUri).base64 } },
  );
}

function textOnly(content: Parameters<typeof toContentBlocks>[0]): string {
  return toContentBlocks(content)
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  private client: GoogleGenerativeAI;

  constructor(apiKey: string = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "") {
    if (!apiKey) {
      throw new AIProviderError("gemini", "GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const systemMessage = options.messages.find((m) => m.role === "system");
    const model = this.client.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: systemMessage ? textOnly(systemMessage.content) : undefined,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        responseMimeType: options.jsonSchema ? "application/json" : "text/plain",
      },
    });

    const history = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: toGeminiParts(m.content),
      }));

    const last = history.pop();
    if (!last) {
      throw new AIProviderError("gemini", "at least one user message is required");
    }

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last.parts);
      const text = result.response.text();
      const usage = result.response.usageMetadata;

      return {
        text,
        raw: result.response,
        model: DEFAULT_MODEL,
        usage: {
          inputTokens: usage?.promptTokenCount ?? 0,
          outputTokens: usage?.candidatesTokenCount ?? 0,
        },
      };
    } catch (error) {
      throw new AIProviderError("gemini", "generation failed", error);
    }
  }
}
