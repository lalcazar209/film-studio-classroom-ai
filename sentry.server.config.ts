import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  // No DSN configured (local dev, CI, this sandbox) => the SDK silently
  // no-ops instead of sending anywhere, so this is safe to leave unset.
  enabled: Boolean(process.env.SENTRY_DSN),
});
