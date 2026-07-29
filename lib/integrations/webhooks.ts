import { db } from "@/lib/db";

export interface WebhookEvent {
  type: string;
  summary: string;
  payload: Record<string, unknown>;
}

/**
 * Fires an event out to whichever push-style integrations (Slack, Zapier)
 * an organization has configured. Unlike the OAuth adapters above, these
 * integrations don't get called *into* — we call *out* to a URL the org
 * admin pasted in. Best-effort: a broken webhook must never fail the
 * action that triggered it (project generation, grading, etc.), so
 * failures are logged, not thrown.
 */
export async function dispatchWebhookEvent(organizationId: string, event: WebhookEvent): Promise<void> {
  const connections = await db.integrationConnection.findMany({
    where: { organizationId, provider: { in: ["SLACK", "ZAPIER"] } },
  });

  await Promise.all(
    connections.map(async (connection) => {
      const metadata = connection.metadata as { webhookUrl?: string } | null;
      if (!metadata?.webhookUrl) return;

      try {
        const body =
          connection.provider === "SLACK"
            ? JSON.stringify({ text: `*${event.type}*: ${event.summary}` })
            : JSON.stringify({ event: event.type, summary: event.summary, ...event.payload });

        const response = await fetch(metadata.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!response.ok) {
          console.error(`Webhook dispatch to ${connection.provider} failed: ${response.status}`);
        }
      } catch (error) {
        console.error(`Webhook dispatch to ${connection.provider} threw`, error);
      }
    }),
  );
}
