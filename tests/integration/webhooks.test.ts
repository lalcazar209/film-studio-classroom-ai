import { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { dispatchWebhookEvent } from "@/lib/integrations/webhooks";

const db = new PrismaClient();
let orgId: string;

beforeAll(async () => {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  orgId = org.id;
});

afterAll(async () => {
  await db.integrationConnection.deleteMany({ where: { organizationId: orgId, provider: { in: ["SLACK", "ZAPIER"] } } });
  await db.$disconnect();
});

describe("dispatchWebhookEvent", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await db.integrationConnection.deleteMany({ where: { organizationId: orgId, provider: { in: ["SLACK", "ZAPIER"] } } });
  });

  it("does nothing when no integrations are configured", async () => {
    await dispatchWebhookEvent(orgId, { type: "test", summary: "no-op", payload: {} });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a Slack {text} payload including the event summary", async () => {
    await db.integrationConnection.create({
      data: { organizationId: orgId, provider: "SLACK", metadata: { webhookUrl: "https://hooks.slack.test/abc" } },
    });

    await dispatchWebhookEvent(orgId, { type: "project.generated", summary: 'New project: "Test"', payload: {} });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://hooks.slack.test/abc");
    const body = JSON.parse(init.body as string);
    expect(body.text).toContain("Test");
    expect(body.text).toContain("project.generated");
  });

  it("posts raw JSON (event type + payload fields) to a Zapier webhook", async () => {
    await db.integrationConnection.create({
      data: { organizationId: orgId, provider: "ZAPIER", metadata: { webhookUrl: "https://hooks.zapier.test/abc" } },
    });

    await dispatchWebhookEvent(orgId, { type: "project.generated", summary: "summary", payload: { projectId: "p1" } });

    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ event: "project.generated", summary: "summary", projectId: "p1" });
  });

  it("dispatches to both Slack and Zapier when both are configured", async () => {
    await db.integrationConnection.createMany({
      data: [
        { organizationId: orgId, provider: "SLACK", metadata: { webhookUrl: "https://hooks.slack.test/abc" } },
        { organizationId: orgId, provider: "ZAPIER", metadata: { webhookUrl: "https://hooks.zapier.test/abc" } },
      ],
    });

    await dispatchWebhookEvent(orgId, { type: "test", summary: "s", payload: {} });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("swallows a failed dispatch instead of throwing, so a broken webhook can never fail the triggering action", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await db.integrationConnection.create({
      data: { organizationId: orgId, provider: "SLACK", metadata: { webhookUrl: "https://hooks.slack.test/broken" } },
    });

    await expect(dispatchWebhookEvent(orgId, { type: "test", summary: "s", payload: {} })).resolves.not.toThrow();
  });
});
