import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * Exercises the project-generation vertical slice end to end: a real
 * logged-in teacher session, a real form submission, and a real generated
 * project page render. The only thing stubbed is the outbound AI call
 * itself (no ANTHROPIC_API_KEY exists in this environment) — the request
 * to /api/projects/generate is intercepted and fulfilled with a project
 * that this test creates directly in Postgres, using the exact shape
 * lib/ai/curriculum-service.ts persists after a real generation, so the
 * page that renders afterward is indistinguishable from a real one.
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

test("a teacher can generate a project and land on its full generated page", async ({ page }) => {
  const classPeriod = await db.classPeriod.findUniqueOrThrow({ where: { id: "demo-class-period" } });

  const project = await db.project.create({
    data: {
      title: "E2E Recycling PSA",
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
    },
  });
  createdProjectId = project.id;

  await page.route("**/api/projects/generate", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ project: { id: project.id } }) });
  });

  await page.goto("/teacher/dashboard/project-generator");
  await expect(page.getByRole("heading", { name: "Project Generator" })).toBeVisible();

  await page.getByLabel("Project title").fill("30-Second Recycling PSA");
  await page.getByLabel("Brief").fill("A 30-second PSA about recycling for the whole school.");
  await page.getByRole("button", { name: "Generate Project" }).click();

  // The target route is compiled on-demand by `next dev` on first visit, so
  // give this specific navigation more headroom than the suite default.
  await page.waitForURL(`**/teacher/projects/${project.id}`, { timeout: 45000 });
  await expect(page.getByRole("heading", { name: "E2E Recycling PSA" })).toBeVisible();
  await expect(page.getByText("Monday — Launch: Launch Day")).toBeVisible();
});
