import { describe, expect, it } from "vitest";
import {
  buildStoryboardShotPrompt,
  buildPosterPrompt,
  buildProjectCoverPrompt,
} from "@/lib/ai/image-generation-service";

describe("buildStoryboardShotPrompt", () => {
  it("includes the shot type, description, lighting, movement, and visual theme", () => {
    const prompt = buildStoryboardShotPrompt({
      description: "A student adjusts a boom mic over the interview subject",
      shotType: "Close-up",
      movement: "Static",
      lighting: "Soft key light, warm",
      visualTheme: { palette: ["#1a1a1a", "#e0c097"], lighting: "low-key", lensCharacter: "wide", aesthetic: "documentary" },
    });

    expect(prompt).toContain("Close-up shot");
    expect(prompt).toContain("static");
    expect(prompt).toContain("boom mic");
    expect(prompt).toContain("Soft key light, warm");
    expect(prompt).toContain("documentary");
    expect(prompt).toContain("wide lens character");
    expect(prompt).toContain("#1a1a1a, #e0c097");
  });
});

describe("buildPosterPrompt", () => {
  it("includes the title, genre, logline, and poster concept", () => {
    const prompt = buildPosterPrompt({
      title: "Corner Store",
      genre: "Documentary",
      logline: "A family fights to keep their store open.",
      posterConcept: "A weathered storefront at golden hour, family silhouetted in the doorway.",
    });

    expect(prompt).toContain("Documentary student film");
    expect(prompt).toContain("Corner Store");
    expect(prompt).toContain("A family fights to keep their store open.");
    expect(prompt).toContain("weathered storefront");
  });
});

describe("buildProjectCoverPrompt", () => {
  it("includes the title, humanized category, and brief", () => {
    const prompt = buildProjectCoverPrompt({
      title: "30-Second Recycling PSA",
      category: "PUBLIC_SERVICE_ANNOUNCEMENT",
      brief: "A PSA encouraging students to recycle in the cafeteria.",
    });

    expect(prompt).toContain("public service announcement");
    expect(prompt).toContain("30-Second Recycling PSA");
    expect(prompt).toContain("A PSA encouraging students to recycle in the cafeteria.");
  });

  it("never leaks the raw underscore-separated enum value into the prompt", () => {
    const prompt = buildProjectCoverPrompt({ title: "t", category: "SHORT_FILM", brief: "b" });
    expect(prompt).not.toContain("SHORT_FILM");
    expect(prompt).toContain("short film");
  });
});
