/**
 * Covers the deterministic parts of Phase 10: webhook dispatch (Slack +
 * Zapier payload shapes) against a real local HTTP server, the Infinite
 * Campus SIS adapter's request construction (Basic auth header, roster
 * mapping) against a real local HTTP server standing in for Campus, and
 * registry lookups. Real OAuth exchanges against Canvas/Schoology/
 * Blackboard/YouTube/Vimeo/Frame.io need live vendor credentials and
 * aren't exercised here, consistent with prior phases.
 */
import http from "node:http";
import { PrismaClient } from "@prisma/client";
import { dispatchWebhookEvent } from "../lib/integrations/webhooks";
import { InfiniteCampusAdapter } from "../lib/integrations/infinite-campus";
import { getIntegrationAdapter, listAvailableProviders } from "../lib/integrations/registry";
import { getSisAdapter } from "../lib/integrations/sis-registry";
import { getVideoHostAdapter } from "../lib/integrations/video-host-registry";

const db = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok: ${message}`);
}

function startCapturingServer(handler: (req: http.IncomingMessage, body: string) => { status: number; body: string }) {
  const received: { req: http.IncomingMessage; body: string }[] = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      received.push({ req, body: raw });
      const result = handler(req, raw);
      res.writeHead(result.status, { "content-type": "application/json" });
      res.end(result.body);
    });
  });
  return { server, received };
}

async function main() {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });

  // --- Registry lookups ---
  await assert(listAvailableProviders().includes("CANVAS"), "Canvas is registered as an LMS adapter");
  await assert(listAvailableProviders().includes("SCHOOLOGY"), "Schoology is registered as an LMS adapter");
  await assert(listAvailableProviders().includes("BLACKBOARD"), "Blackboard is registered as an LMS adapter");
  try {
    getIntegrationAdapter("ADOBE_CREATIVE_CLOUD");
    throw new Error("expected error");
  } catch (e) {
    await assert(
      e instanceof Error && e.message.includes("No LMS integration adapter"),
      "requesting an unregistered LMS provider throws a clear error, not a silent no-op",
    );
  }
  await assert(getSisAdapter("INFINITE_CAMPUS") instanceof InfiniteCampusAdapter, "Infinite Campus resolves via the SIS registry, not the LMS registry");
  await assert(getVideoHostAdapter("YOUTUBE").provider === "YOUTUBE", "YouTube resolves via the video host registry");
  await assert(getVideoHostAdapter("VIMEO").provider === "VIMEO", "Vimeo resolves via the video host registry");
  await assert(getVideoHostAdapter("FRAME_IO").provider === "FRAME_IO", "Frame.io resolves via the video host registry");

  // --- Webhook dispatch: Slack + Zapier payload shapes, real HTTP ---
  const slackCapture = startCapturingServer(() => ({ status: 200, body: "ok" }));
  const zapierCapture = startCapturingServer(() => ({ status: 200, body: "{}" }));
  await new Promise<void>((resolve) => slackCapture.server.listen(0, resolve));
  await new Promise<void>((resolve) => zapierCapture.server.listen(0, resolve));
  const slackPort = (slackCapture.server.address() as { port: number }).port;
  const zapierPort = (zapierCapture.server.address() as { port: number }).port;

  await db.integrationConnection.upsert({
    where: { organizationId_provider: { organizationId: org.id, provider: "SLACK" } },
    update: { metadata: { webhookUrl: `http://127.0.0.1:${slackPort}/hook` } },
    create: { organizationId: org.id, provider: "SLACK", metadata: { webhookUrl: `http://127.0.0.1:${slackPort}/hook` } },
  });
  await db.integrationConnection.upsert({
    where: { organizationId_provider: { organizationId: org.id, provider: "ZAPIER" } },
    update: { metadata: { webhookUrl: `http://127.0.0.1:${zapierPort}/hook` } },
    create: { organizationId: org.id, provider: "ZAPIER", metadata: { webhookUrl: `http://127.0.0.1:${zapierPort}/hook` } },
  });

  try {
    await dispatchWebhookEvent(org.id, {
      type: "project.generated",
      summary: 'New project generated: "Test Project"',
      payload: { projectId: "abc123" },
    });

    await assert(slackCapture.received.length === 1, "Slack webhook received exactly one POST");
    const slackBody = JSON.parse(slackCapture.received[0]!.body);
    await assert(
      typeof slackBody.text === "string" && slackBody.text.includes("Test Project"),
      "Slack payload uses Slack's {text} shape and includes the event summary",
    );

    await assert(zapierCapture.received.length === 1, "Zapier webhook received exactly one POST");
    const zapierBody = JSON.parse(zapierCapture.received[0]!.body);
    await assert(zapierBody.event === "project.generated" && zapierBody.projectId === "abc123", "Zapier payload is raw JSON including the event type and custom payload fields");
  } finally {
    slackCapture.server.close();
    zapierCapture.server.close();
  }

  // A broken webhook URL must not throw out of dispatchWebhookEvent.
  await db.integrationConnection.update({
    where: { organizationId_provider: { organizationId: org.id, provider: "SLACK" } },
    data: { metadata: { webhookUrl: "http://127.0.0.1:1/definitely-not-listening" } },
  });
  await dispatchWebhookEvent(org.id, { type: "test", summary: "should not throw", payload: {} });
  console.log("ok: a broken webhook URL is swallowed (logged, not thrown) so it can never fail the triggering action");

  // --- Infinite Campus adapter: Basic auth + roster mapping, real HTTP ---
  const campusCapture = startCapturingServer(() => ({
    status: 200,
    body: JSON.stringify([
      {
        sectionId: "SEC-1",
        sectionName: "Intro to Film - Period 3",
        teacherId: "T-100",
        students: [
          { studentId: "S-1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", grade: "10" },
          { studentId: "S-2", firstName: "Grace", lastName: "Hopper", email: null, grade: "10" },
        ],
      },
    ]),
  }));
  await new Promise<void>((resolve) => campusCapture.server.listen(0, resolve));
  const campusPort = (campusCapture.server.address() as { port: number }).port;

  try {
    const adapter = new InfiniteCampusAdapter();
    const sections = await adapter.fetchRoster(
      { baseUrl: `http://127.0.0.1:${campusPort}`, apiKey: "test-key", apiSecret: "test-secret" },
      "SCHOOL-1",
    );

    await assert(sections.length === 1, "roster fetch returns the sections Campus reports");
    await assert(sections[0]!.students.length === 2, "section-to-student mapping preserves all students");
    await assert(sections[0]!.students[0]!.sisStudentId === "S-1", "student SIS ids map through correctly");

    const authHeader = campusCapture.received[0]!.req.headers.authorization;
    const expectedAuth = `Basic ${Buffer.from("test-key:test-secret").toString("base64")}`;
    await assert(authHeader === expectedAuth, "requests are Basic-authenticated with the configured API key/secret");
  } finally {
    campusCapture.server.close();
  }

  // Cleanup.
  await db.integrationConnection.deleteMany({ where: { organizationId: org.id, provider: { in: ["SLACK", "ZAPIER"] } } });

  console.log("\nAll Phase 10 smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
