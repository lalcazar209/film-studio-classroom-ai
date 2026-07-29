# Deployment

Production target: **Vercel** (app hosting) + **Supabase** (Postgres) +
**Sentry** (error reporting). This doc is the actual step-by-step for
standing that up — none of these are automated from this repo, since
provisioning a Vercel project, a Supabase project, and a Sentry project all
require an authenticated human clicking through each vendor's console.

## 1. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com) (pick a region
   close to your users/school).
2. Project Settings → Database → Connection string. Supabase gives you two
   connection strings that both matter here:
   - **Transaction pooler** (port `6543`, `?pgbouncer=true`) → `DATABASE_URL`.
     Every runtime query goes through this — serverless functions open far
     more concurrent connections than direct Postgres tolerates, and
     pgbouncer's transaction-pooling mode handles that.
   - **Direct connection** (port `5432`) → `DIRECT_URL`. `prisma migrate
     deploy` needs this — migrations run DDL and take an advisory lock that
     pgbouncer's transaction pooling mode doesn't support.
3. Apply the schema once, from your machine (or CI — see below), pointed at
   the new database:
   ```bash
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
   ```
4. Optionally seed reference data (California CTE/VAPA/ISTE standards) —
   **not** the demo org/users, which are local-dev-only fixtures:
   Prisma's seed script (`prisma/seed.ts`) currently seeds both standards
   and a demo org; for a real production database, run it once and then
   delete the demo org/users it creates (`demo-org` and its users) through
   `/admin/dashboard/users` after your first real admin exists, or trim
   `prisma/seed.ts` to standards-only before running it against production.

## 2. Vercel (app)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: Next.js (auto-detected). No custom build command
   needed — `package.json`'s `vercel-build` script
   (`prisma migrate deploy && next build`) is picked up automatically by
   Vercel's build system, so every deploy applies any new migrations
   before building.
3. Environment variables (Project Settings → Environment Variables) — set
   for both **Production** and **Preview**, using separate Supabase
   projects per environment if you want preview deploys isolated from
   production data:
   - `DATABASE_URL`, `DIRECT_URL` — from Supabase (step 1).
   - `AUTH_SECRET` — `openssl rand -base64 33`.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from a Google Cloud
     OAuth client (Web application type); add
     `https://<your-domain>/api/auth/callback/google` as an authorized
     redirect URI. Set `GOOGLE_WORKSPACE_DOMAIN` if you want to restrict
     sign-in to one Google Workspace for Education domain.
   - `DEFAULT_AI_PROVIDER` + the matching API key
     (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`).
   - Any of the optional integration credentials your school actually uses
     (Cloudinary, Canvas/Schoology/Blackboard, Vimeo/Adobe/Frame.io, Gamma)
     — see `.env.example` for the full list. Every one of these is
     genuinely optional; the app runs without them, just with that
     integration's features unavailable.
   - `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`,
     `SENTRY_AUTH_TOKEN` — from step 3 below.
4. Deploy. Vercel builds on Node.js automatically; no `engines` overrides
   needed beyond what's already in `package.json`.
5. `middleware.ts` requires the Node.js middleware runtime (`export const
   config = { runtime: "nodejs" }`, Next.js 15.5+, stable) because it
   resolves Auth.js database sessions through Prisma, which can't run on
   Vercel's Edge runtime without Accelerate/driver adapters. This is
   already configured in the repo — no action needed, just don't remove
   `runtime: "nodejs"` from `middleware.ts`'s config when editing it.

## 3. Sentry (error reporting)

1. Create a project at [sentry.io](https://sentry.io) — platform: Next.js.
2. Client Keys (DSN) → copy the DSN into both `SENTRY_DSN` (server) and
   `NEXT_PUBLIC_SENTRY_DSN` (browser) — same value, two env vars, because
   the browser bundle can only read `NEXT_PUBLIC_*`-prefixed vars.
3. Settings → Auth Tokens → create a token with `project:releases` scope,
   set it as `SENTRY_AUTH_TOKEN`. This is only used at build time to
   upload source maps (`next.config.ts`'s `withSentryConfig` call) so
   stack traces resolve to real source rather than minified bundles;
   without it, builds still succeed, source maps just aren't uploaded.
4. Set `SENTRY_ORG` and `SENTRY_PROJECT` to the slugs shown in the
   project's Settings page.
5. Without any of `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` set (local dev, CI,
   preview deploys you don't want reporting from), the SDK initializes
   with `enabled: false` and silently does nothing — see
   `sentry.server.config.ts`, `sentry.edge.config.ts`,
   `instrumentation-client.ts`.
6. Structured application logs (`lib/logger.ts`) already call
   `Sentry.captureException`/`captureMessage` on every `logger.error(...)`
   call across the API routes — no additional wiring needed once the DSN
   is set.

## 4. GitHub Actions

`.github/workflows/ci.yml` runs against a throwaway `postgres:16` service
container with dummy credentials — it never touches the real Supabase
database and needs no secrets. It's a pre-merge gate (typecheck, lint,
Vitest, build, Playwright), not a deploy step; Vercel's own GitHub
integration handles the actual deploy on merge to `main`.

## 5. Docker Compose (self-hosting, or local prod-parity testing)

`docker-compose.yml` + `Dockerfile` build the same `next build` standalone
output Vercel would run, against a local Postgres instead of Supabase. See
the "Local development with Docker Compose" section of `README.md`. This
is useful for testing the production build path locally, or for
self-hosting instead of Vercel — swap `DATABASE_URL`/`DIRECT_URL` for a
real Postgres instance (Supabase or otherwise) to go to production this
way instead.
