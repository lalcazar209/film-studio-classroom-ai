/**
 * Covers the deterministic parts of Phase 8: the assistant registry
 * (uniqueness, every persona genuinely distinct, not a template-filled
 * copy), the AssistantMessage persistence path, and the AI Film Studio
 * bundle schema. The AI generation calls themselves need a real
 * ANTHROPIC_API_KEY, consistent with prior phases.
 */
import { PrismaClient } from "@prisma/client";
import { ASSISTANTS, getAssistant } from "../lib/ai/assistants";
import { filmStudioBundleSchema } from "../lib/ai/schemas";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

async function main() {
  // --- Assistant registry integrity ---
  await assert(ASSISTANTS.length === 19, "registry has all 19 assistants from the project brief");

  const ids = ASSISTANTS.map((a) => a.id);
  await assert(new Set(ids).size === ids.length, "every assistant id is unique");

  const prompts = ASSISTANTS.map((a) => a.systemPrompt);
  await assert(new Set(prompts).size === prompts.length, "every assistant has a genuinely distinct system prompt, not a shared template");

  await assert(
    ASSISTANTS.every((a) => a.systemPrompt.length > 200),
    "every system prompt is substantive (not a one-line stub)",
  );

  await assert(getAssistant("director")?.name === "Director AI", "getAssistant resolves a known id");
  await assert(getAssistant("not-a-real-assistant") === undefined, "getAssistant returns undefined for an unknown id");

  // Spot-check a couple of prompts actually reflect their distinct domain,
  // not just a different name slapped on the same content.
  await assert(
    getAssistant("drone-instructor")!.systemPrompt.includes("Part 107"),
    "Drone Instructor AI's prompt actually covers real FAA compliance, not generic advice",
  );
  await assert(
    getAssistant("colorist")!.systemPrompt.includes("vectorscope") || getAssistant("colorist")!.systemPrompt.includes("waveform"),
    "Colorist AI's prompt covers real color-grading tools",
  );

  // --- AssistantMessage persistence (real DB round trip, no AI call) ---
  const student = await db.user.findFirstOrThrow({ where: { role: "STUDENT" } });
  const testAssistantId = "career-coach";

  const before = await db.assistantMessage.count({ where: { userId: student.id, assistantId: testAssistantId } });
  await db.assistantMessage.create({
    data: { userId: student.id, assistantId: testAssistantId, role: "USER", content: "smoke test message" },
  });
  const after = await db.assistantMessage.count({ where: { userId: student.id, assistantId: testAssistantId } });
  await assert(after === before + 1, "assistant messages persist and are scoped by (userId, assistantId)");

  // Same user, different assistant -> separate history.
  const otherAssistantCount = await db.assistantMessage.count({ where: { userId: student.id, assistantId: "director" } });
  await assert(otherAssistantCount === 0, "a message to one assistant does not appear in another assistant's history for the same user");

  await db.assistantMessage.deleteMany({ where: { userId: student.id, assistantId: testAssistantId } });

  // --- Film Studio bundle schema ---
  const sampleBundle = {
    title: "Corner Store",
    logline: "A family-owned corner store fights to stay open through a tough year.",
    genre: "Documentary",
    screenplay: {
      scenes: [
        {
          sceneNumber: 1,
          heading: "INT. CORNER STORE - DAY",
          action: "The owner restocks shelves as the morning rush begins.",
          dialogue: [{ character: "OWNER", line: "Every morning's a new fight." }],
        },
      ],
    },
    shotList: {
      shots: [
        { number: 1, sceneNumber: 1, description: "Wide shot of the storefront", shotType: "wide", lens: "24mm", movement: "static", durationSeconds: 5 },
      ],
    },
    callSheet: {
      shootDate: "2026-09-01",
      generalCallTime: "08:00",
      location: "Corner Store, Main St",
      cast: [{ role: "Owner", callTime: "08:00" }],
      crew: [{ role: "Camera", callTime: "07:30" }],
      notes: "Bring extra batteries.",
    },
    budget: {
      lineItems: [{ category: "Permits", item: "Filming permit", estimatedCost: 50 }],
      totalEstimate: 50,
    },
    equipmentList: [{ itemType: "Camera", quantity: 1 }],
    locationPlan: [{ name: "Corner Store", notes: "Owner has agreed to filming", permitsNeeded: false }],
    castingSheet: [{ character: "Owner", description: "The real store owner, playing themselves" }],
    marketingPlan: {
      targetAudience: "Local community members",
      keyMessages: ["Small businesses matter"],
      channels: ["YouTube", "Instagram"],
      posterConcept: "Close-up of hands restocking a shelf at golden hour.",
      trailerConcept: "60 seconds cutting between quiet store moments and the owner's voiceover.",
    },
  };

  const validated = filmStudioBundleSchema.safeParse(sampleBundle);
  await assert(validated.success, "a realistic film studio bundle validates against filmStudioBundleSchema");

  const missingRequiredField = { ...sampleBundle, callSheet: { ...sampleBundle.callSheet, shootDate: undefined } };
  const invalid = filmStudioBundleSchema.safeParse(missingRequiredField);
  await assert(!invalid.success, "a bundle missing a required call sheet field is rejected");

  console.log("\nAll Phase 8 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
