import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebhookIntegrationForm } from "@/components/webhook-integration-form";
import { SisIntegrationForm } from "@/components/sis-integration-form";
import { IntegrationProviderType } from "@prisma/client";

const OAUTH_LMS_PROVIDERS: { provider: IntegrationProviderType; label: string; envHint: string }[] = [
  { provider: "GOOGLE_CLASSROOM", label: "Google Classroom", envHint: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" },
  { provider: "CANVAS", label: "Canvas", envHint: "CANVAS_BASE_URL, CANVAS_CLIENT_ID / CANVAS_CLIENT_SECRET" },
  { provider: "SCHOOLOGY", label: "Schoology", envHint: "SCHOOLOGY_CLIENT_ID / SCHOOLOGY_CLIENT_SECRET" },
  { provider: "BLACKBOARD", label: "Blackboard", envHint: "BLACKBOARD_BASE_URL, BLACKBOARD_APP_KEY / BLACKBOARD_APP_SECRET" },
];

const VIDEO_HOST_PROVIDERS: { provider: IntegrationProviderType; label: string; envHint: string }[] = [
  { provider: "YOUTUBE", label: "YouTube", envHint: "Uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET with the upload scope" },
  { provider: "VIMEO", label: "Vimeo", envHint: "VIMEO_CLIENT_ID / VIMEO_CLIENT_SECRET" },
  { provider: "FRAME_IO", label: "Frame.io (Adobe)", envHint: "ADOBE_CLIENT_ID / ADOBE_CLIENT_SECRET, FRAME_IO_ACCOUNT_ID / FRAME_IO_ROOT_FOLDER_ID" },
];

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard/integrations");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  if (!session.user.organizationId) redirect("/onboarding");

  const connections = await db.integrationConnection.findMany({
    where: { organizationId: session.user.organizationId },
  });
  const connectionByProvider = new Map(connections.map((c) => [c.provider, c]));

  const slackConnection = connectionByProvider.get("SLACK");
  const zapierConnection = connectionByProvider.get("ZAPIER");
  const icConnection = connectionByProvider.get("INFINITE_CAMPUS");

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Integrations</h1>
        <p className="text-studio-ink/60 dark:text-white/60">
          Connect the tools your school already uses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Slack</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-studio-ink/60 dark:text-white/60">
            Get a notification in Slack whenever a project is generated. Create an{" "}
            <span className="font-mono">Incoming Webhook</span> in your Slack workspace and paste
            the URL here.
          </p>
          <WebhookIntegrationForm
            provider="SLACK"
            label="Slack Incoming Webhook URL"
            placeholder="https://hooks.slack.com/services/..."
            initialUrl={(slackConnection?.metadata as { webhookUrl?: string } | null)?.webhookUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zapier / Make</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-studio-ink/60 dark:text-white/60">
            Send platform events to a Zapier (or Make) webhook to build your own automations.
          </p>
          <WebhookIntegrationForm
            provider="ZAPIER"
            label="Webhook URL"
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            initialUrl={(zapierConnection?.metadata as { webhookUrl?: string } | null)?.webhookUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Infinite Campus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-studio-ink/60 dark:text-white/60">
            Infinite Campus is a Student Information System, not an LMS — this connects for
            roster lookups and grade passback, not assignment creation. Your district&apos;s IT
            team issues the API key/secret.
          </p>
          <SisIntegrationForm
            initialBaseUrl={(icConnection?.metadata as { baseUrl?: string } | null)?.baseUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LMS connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {OAUTH_LMS_PROVIDERS.map(({ provider, label, envHint }) => (
            <div key={provider} className="flex items-center justify-between border-b border-studio-ink/5 pb-2 last:border-0 dark:border-white/5">
              <span>{label}</span>
              <span className="text-xs text-studio-ink/50 dark:text-white/50">
                {connectionByProvider.has(provider) ? "Connected" : `Not connected — needs ${envHint}`}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video hosting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {VIDEO_HOST_PROVIDERS.map(({ provider, label, envHint }) => (
            <div key={provider} className="flex items-center justify-between border-b border-studio-ink/5 pb-2 last:border-0 dark:border-white/5">
              <span>{label}</span>
              <span className="text-xs text-studio-ink/50 dark:text-white/50">
                {connectionByProvider.has(provider) ? "Connected" : `Not connected — needs ${envHint}`}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
