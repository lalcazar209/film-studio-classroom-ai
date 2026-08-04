import { describe, expect, it, vi, afterEach } from "vitest";
import { logger } from "@/lib/logger";

function lastLoggedEntry(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const line = spy.mock.calls.at(-1)?.[0] as string;
  return JSON.parse(line);
}

describe("logger.error", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a flat error's name, message, and stack with no causeChain", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("something broke", new Error("boom"));

    const entry = lastLoggedEntry(spy);
    expect(entry.errorName).toBe("Error");
    expect(entry.errorMessage).toBe("boom");
    expect(entry.stack).toContain("Error: boom");
    expect(entry.causeChain).toBeUndefined();
  });

  it("unwraps a wrapped error's .cause into causeChain, preserving the underlying SDK error's status/type", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    class FakeAnthropicAPIError extends Error {
      status = 401;
      type = "authentication_error";
      constructor(message: string) {
        super(message);
        this.name = "AuthenticationError";
      }
    }
    class FakeAIProviderError extends Error {
      constructor(
        message: string,
        public readonly cause?: unknown,
      ) {
        super(message);
        this.name = "AIProviderError";
      }
    }

    const underlying = new FakeAnthropicAPIError("invalid x-api-key");
    const wrapped = new FakeAIProviderError("[anthropic] generation failed", underlying);

    logger.error("AI Film Studio generation failed", wrapped);

    const entry = lastLoggedEntry(spy);
    expect(entry.errorName).toBe("AIProviderError");
    expect(Array.isArray(entry.causeChain)).toBe(true);
    const chain = entry.causeChain as Array<Record<string, unknown>>;
    expect(chain).toHaveLength(1);
    const [cause] = chain;
    expect(cause?.errorName).toBe("AuthenticationError");
    expect(cause?.errorMessage).toBe("invalid x-api-key");
    expect(cause?.status).toBe(401);
    expect(cause?.type).toBe("authentication_error");
  });

  it("stops unwrapping a self-referential cause instead of looping forever", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const selfReferential = new Error("loopy") as Error & { cause?: unknown };
    selfReferential.cause = selfReferential;

    expect(() => logger.error("self-referential", selfReferential)).not.toThrow();
    const entry = lastLoggedEntry(spy);
    expect(entry.causeChain).toBeUndefined();
  });
});
