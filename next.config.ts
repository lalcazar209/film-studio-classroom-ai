import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone build (server + only the
  // node_modules it actually needs) so the Docker image doesn't have to
  // ship the whole node_modules tree. See Dockerfile.
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Without SENTRY_AUTH_TOKEN (true for local dev, CI, and this sandbox —
  // no live Sentry project exists here) the plugin just skips source map
  // upload with a warning rather than failing the build.
  silent: !process.env.CI,
  widenClientFileUpload: true,
  telemetry: false,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
