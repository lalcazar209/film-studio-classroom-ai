import { describe, expect, it } from "vitest";
import { parseAIJson, AIJsonParseError } from "@/lib/ai/json-parsing";

describe("parseAIJson", () => {
  it("parses clean JSON directly", () => {
    expect(parseAIJson('{"title": "Test"}')).toEqual({ title: "Test" });
  });

  it("strips markdown code fences before parsing", () => {
    expect(parseAIJson('```json\n{"title": "Test"}\n```')).toEqual({ title: "Test" });
    expect(parseAIJson('```\n{"title": "Test"}\n```')).toEqual({ title: "Test" });
  });

  it("recovers JSON embedded in stray prose the model added despite being told not to", () => {
    const text = 'Sure, here is the curriculum:\n\n{"title": "Test"}\n\nLet me know if you need changes!';
    expect(parseAIJson(text)).toEqual({ title: "Test" });
  });

  it("recovers a JSON array embedded in prose", () => {
    const text = 'Here you go:\n["a", "b", "c"]\nHope that helps.';
    expect(parseAIJson(text)).toEqual(["a", "b", "c"]);
  });

  it("throws AIJsonParseError (not a silent {}) for truncated/malformed JSON", () => {
    const truncated = '{"title": "Test", "lessons": [{"day": "MONDAY_LAUNCH"';
    expect(() => parseAIJson(truncated)).toThrow(AIJsonParseError);
  });

  it("includes a snippet of the raw text in the thrown error for debugging", () => {
    const truncated = '{"title": "Recognizable Marker Text"';
    try {
      parseAIJson(truncated);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AIJsonParseError);
      expect((error as AIJsonParseError).message).toContain("Recognizable Marker Text");
      expect((error as AIJsonParseError).rawText).toBe(truncated);
    }
  });

  it("truncates a very long raw response in the error message rather than dumping it all", () => {
    const longGarbage = "not json at all, ".repeat(100);
    try {
      parseAIJson(longGarbage);
      expect.unreachable("should have thrown");
    } catch (error) {
      const message = (error as AIJsonParseError).message;
      expect(message.length).toBeLessThan(longGarbage.length);
      expect(message).toContain("…");
    }
  });
});
