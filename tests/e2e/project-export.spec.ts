import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * Exercises project export through the actual built-and-served Next app,
 * not just the renderer functions directly under Vitest (tests/integration/
 * export.test.ts) — that suite calls renderProjectPdf() straight from Node
 * and never caught a real production bug where the PDF route crashed only
 * once compiled through Next's webpack bundle (see next.config.ts history:
 * marking @react-pdf/renderer as a server-external package pulled its
 * internal `require("react")` out of that bundle, so it resolved a
 * different React module instance than the one used to compile the JSX in
 * project-pdf.tsx, and the mismatch threw React error #31 deep inside the
 * reconciler). Hitting the route over HTTP is what actually proves the
 * export works end to end.
 */

const db = new PrismaClient();
let createdProjectId: string | null = null;

test.afterEach(async () => {
  if (createdProjectId) {
    await db.project.delete({ where: { id: createdProjectId } }).catch(() => {});
    createdProjectId = null;
  }
});

test.afterAll(async () => {
  await db.$disconnect();
});

test("a teacher can download a generated project as a PDF", async ({ page }) => {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });

  const project = await db.project.create({
    data: {
      title: "E2E Export PSA",
      category: "PSA",
      status: "READY",
      classPeriodId: classPeriod.id,
      brief: "A 30-second PSA about recycling for the whole school.",
      lessons: {
        create: [
          {
            day: "MONDAY_LAUNCH",
            title: "Launch Day",
            objective: "Students will understand the assignment.",
            iCanStatement: "I can explain the project goal.",
            agenda: [{ label: "Hook", minutes: 5, description: "Watch a sample PSA." }],
            worksheet: { title: "Launch worksheet", instructions: "Fill it out.", sections: [] },
            differentiation: { accommodations: ["Extra time"], extensions: ["Twist ending"], interventions: ["1:1 check-in"] },
          },
        ],
      },
      rubric: { create: { title: "PSA Rubric", criteria: [{ name: "Clarity", weightPercent: 100, levels: [] }] } },
      quiz: { create: { title: "PSA Quiz", questions: [{ prompt: "What is a PSA?", type: "short_answer", answer: "Public service announcement" }] } },
      vocabulary: { create: [{ term: "PSA", definition: "Public service announcement" }] },
    },
  });
  createdProjectId = project.id;

  const response = await page.request.get(`/api/projects/${project.id}/export/pdf`);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toBe("application/pdf");

  const body = await response.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(body.length).toBeGreaterThan(1000);
});
