# Architecture

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, Route Handlers) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | NextAuth v5 (database sessions, Google OAuth — Workspace-for-Education-restrictable) |
| AI | Provider-agnostic service layer: Anthropic Claude, OpenAI, Google Gemini |
| Media storage | Cloudinary (planned — see Roadmap Phase 6) |
| Deployment target | Vercel (app) + Supabase (db/storage) |

## Core principle: everything communicates with everything

The platform is not a lesson planner; it's an operating system. The unit of
work is a **Project** (one Monday–Friday PBL week), and generating one
project cascades into every downstream artifact in a single transaction:

```
Teacher brief
     │
     ▼
lib/ai/curriculum-service.ts  (generateProjectBundle)
     │
     ├─ calls lib/ai/registry.ts → an AIProvider (Anthropic/OpenAI/Gemini)
     ├─ validates the response against lib/ai/schemas.ts (Zod)
     └─ persists atomically via Prisma:
          Project
          ├── 5× Lesson (Mon–Fri, each with objective, "I can" statement,
          │              agenda, worksheet, differentiation plan, standards)
          ├── Rubric
          ├── Quiz
          ├── VocabularyTerm[]
          ├── Storyboard (visual theme + shot list)
          └── ProductionPlan (call sheet, crew roles, equipment, schedule)
```

Every `Standard` code the model cites is resolved or auto-registered, so the
standards library grows with use instead of silently dropping alignment
data (`resolveStandards` in `curriculum-service.ts`).

This same pattern — one generation call, one transaction, N related
artifacts — is how every other "generate X" feature in the project brief
(Video Academy tutorials, SkillsUSA competition packets, AI Film Studio
screenplay-to-shot-list pipelines) should be built. Don't add a new ad hoc
AI call per artifact type; extend the bundle schema and the transaction.

## Service layer pattern

### AI services (`lib/ai/`)

- `provider.ts` — the `AIProvider` interface every model adapter implements.
- `providers/{anthropic,openai,gemini}.ts` — concrete adapters.
- `registry.ts` — lazy factory + cache, selects the default provider from
  `DEFAULT_AI_PROVIDER`, so a missing API key for an unused provider never
  blocks startup.
- `schemas.ts` — Zod schemas that are both the validation layer and the
  source of truth for what "one full generation" contains.
- `curriculum-service.ts` — orchestrates generate → validate → persist.
- `media.ts` — fetches a remote image (e.g. a Cloudinary video-frame
  thumbnail) into a base64 data URI, the one format all three providers'
  image support normalizes from.

`AIMessage.content` accepts either a plain string or an array of
`AIContentBlock` (`{type: "text"}` | `{type: "image", dataUri}`), so a
service can attach images (video frames, uploaded stills) without any
provider-specific code — each adapter converts the shared data-URI format
into its own image-input shape (Anthropic base64 `source`, OpenAI
`image_url`, Gemini `inlineData`). `video-review-service.ts` is the first
consumer: it pulls Cloudinary-generated frame thumbnails via
`lib/integrations/cloudinary.ts` and attaches them alongside text context.

Adding a new generation-style AI service (Video Academy, AI Film Studio,
...) means adding a new schema + a new service function that calls
`getAIProvider()`, not a new provider integration. The 19 named AI
Assistants (Director AI, Editor AI, Colorist AI, Career Coach, ...) follow
a sibling pattern for chat rather than generate-once: `assistants.ts` is a
registry of `{id, name, systemPrompt}`, and `assistant-chat-service.ts` is
the one chat loop every assistant shares — persona differences live
entirely in the registry's system prompts, not in per-assistant code.

### Third-party integrations (`lib/integrations/`)

Not every third-party service fits the same shape — forcing them all into
one interface would mean either bloating it with methods most providers
don't support, or lying about what a provider actually does. Instead
there are three narrow contracts, one per genuinely different integration
category:

- **LMS adapters** (`adapter.ts`'s `IntegrationAdapter`: OAuth exchange,
  token refresh, `createAssignment`) — `google-classroom.ts`, `canvas.ts`,
  `schoology.ts`, `blackboard.ts`, registered in `registry.ts`. These all
  manage courses/coursework.
- **SIS adapters** (`sis-adapter.ts`'s `SisAdapter`: `fetchRoster`,
  `pushGrade`) — `infinite-campus.ts`, registered in `sis-registry.ts`. A
  Student Information System owns the official roster and official
  gradebook; it has no "assignments" to create. Credentials are
  district-issued per Campus instance, not a self-serve OAuth app.
- **Video host adapters** (`video-host-adapter.ts`'s `VideoHostAdapter`:
  OAuth exchange, token refresh, `uploadVideo`) — `youtube.ts`,
  `vimeo.ts`, `frameio.ts`, registered in `video-host-registry.ts`. These
  publish/share a video file rather than manage coursework.
- **Push-style webhooks** (`webhooks.ts`'s `dispatchWebhookEvent`) —
  Slack and Zapier/Make don't get called *into*; an org admin pastes a
  webhook URL and the app calls *out* to it when something happens
  (e.g. `project.generated`, fired from `curriculum-service.ts`).
  Best-effort by design: a broken webhook is logged, never allowed to
  fail the action that triggered it.

Every registry throws a clear "not implemented" error for an unconfigured
provider instead of silently no-op'ing.

Integration credentials persist in `IntegrationConnection`, scoped per
`Organization`, never per-user — a school connects Google Classroom once,
every teacher in that org can push assignments through it. The same model
holds Slack/Zapier webhook URLs and Infinite Campus's API key/secret in
its `metadata` JSON field, since those aren't OAuth-token-shaped.

### Export pipeline (`lib/export/`)

Split by whether it needs an external API:

- **Local generation, no API/credentials needed**: `project-pdf.tsx`
  (`@react-pdf/renderer`), `project-docx.ts` (`docx`), `project-pptx.ts`
  (`pptxgenjs`). These always work regardless of deployment
  configuration, so they're the default "just download it" path.
- **External API required**: `gamma.ts` (Gamma's public Generate API —
  submit an outline, poll until done, get a shareable URL) and
  `google-docs.ts` (Drive + Docs API). Both are real, ready-to-call
  implementations; `google-docs.ts` is currently unreachable from the UI
  because the `GOOGLE_WORKSPACE` OAuth connection that would supply a
  docs/drive-scoped token isn't wired up yet (see ROADMAP.md Phase 11).

Each export target has its own small "shape this record into export
input" helper (e.g. `buildProjectOutline`) kept next to the
renderer/API-caller it feeds — deterministic and independently testable
without needing the external API to be live.

## Access control

- `Role` enum (STUDENT, TEACHER, ADMIN, PARENT, MENTOR) lives on `User`,
  defaulting to `STUDENT` (least privilege) for every new sign-in.
- Every role promotion beyond that default goes through `lib/invites.ts`:
  an ADMIN issues a token tied to one email address, and only accepting
  that exact token (from a session whose email matches) promotes the user
  — never a self-service role picker. Parent-to-student links work the
  same way: an admin/teacher chooses the specific existing student when
  creating the invite, so a parent can never attach themselves to an
  arbitrary student record.
- The one exception is `lib/organizations.ts`: a user with no
  `organizationId` can bootstrap a brand-new `Organization` and becomes
  its ADMIN, since someone has to be first. A user who already belongs to
  an org cannot create/join a second one this way.
- `User.isActive` (Phase 12, `lib/user-management.ts`) lets an admin
  deactivate a member without deleting their history — `middleware.ts`
  redirects an inactive user's session to `/account-disabled` instead of
  letting them into any portal. Guarded so an admin can't deactivate
  themselves, and the sole remaining admin in an org can't demote
  themselves out of the role, mirroring the invite system's "someone has
  to be able to run the school" principle.
- `middleware.ts` enforces role-prefixed routes (`/teacher/*`, `/student/*`,
  `/admin/*`, `/parent/*`, `/mentor/*`); ADMIN can traverse all portals for
  support/oversight, every other role is confined to its own prefix.
- API routes re-check role + ownership server-side (e.g.
  `app/api/projects/generate/route.ts` verifies the requesting teacher
  actually teaches the target `ClassPeriod`) — middleware is a routing
  convenience, not the authorization boundary.
- `middleware.ts` sets `export const config = { runtime: "nodejs" }`
  because `auth()` resolves sessions through `PrismaAdapter`, and Prisma
  Client cannot run on Next's default Edge middleware runtime without
  Accelerate/driver adapters. This only surfaces when middleware handles
  a real HTTP request with a real session cookie — no unit or integration
  test calling library functions directly exercises it, which is exactly
  how it stayed unnoticed until the Phase 13 Playwright e2e test sent an
  actual browser request through it.

## Testing

Three layers, split by what each is actually able to verify:

- **Unit** (`tests/unit/`, `npm run test:unit`) — pure logic with no I/O:
  Zod schema accept/reject cases (`lib/ai/schemas.ts`), deterministic
  transforms (`lib/captions.ts`, `lib/utils/*`), and integration adapters
  with `fetch` mocked via `vi.stubGlobal("fetch", vi.fn())` — these verify
  the exact request shape sent to a vendor (Canvas, Infinite Campus)
  without a real network call or real credentials.
- **Integration** (`tests/integration/`, `npm run test:integration`) —
  anything that reads or writes real data goes through a real local
  Postgres instance via `PrismaClient` directly, seeded with the same
  `demo-org` every `prisma/seed.ts` run produces. This is the same
  generate-nothing-fake principle the Phase 4–12 `scripts/smoke-test-*.ts`
  scripts used, just formalized into Vitest with proper
  `beforeEach`/`afterEach` teardown instead of one-shot scripts.
- **E2E** (`tests/e2e/`, `npm run test:e2e`, Playwright) — a real browser
  driving a real `next dev` server. Auth is handled by creating a real
  `Session` row in Postgres for the seeded demo teacher and injecting the
  matching `authjs.session-token` cookie as Playwright storage state
  (`tests/e2e/global-setup.ts`) — the same mechanism NextAuth itself uses
  after a real OAuth callback, so no test-only auth bypass exists in
  production code. The only thing stubbed is the outbound AI call, via
  `page.route()` intercepting the browser's `POST /api/projects/generate`
  request — there's no way to fake an outbound server-to-Anthropic call
  from the browser layer, and no `ANTHROPIC_API_KEY` exists in CI/dev
  sandboxes, so the test creates its own project directly in Postgres and
  has the intercepted response point at it, keeping the page that renders
  afterward (and everything server-side) real.

All three env-load the same way non-Prisma scripts have since Phase 6:
`node --env-file=.env ./node_modules/.bin/<tool> ...`, since Prisma
Client's own dotenv side effect only fires once a `PrismaClient` is
instantiated, which is too late for tools that read other env vars first.
Next itself (`next dev`/`next build`) loads `.env` natively, so
`playwright.config.ts`'s `webServer` needs no such wrapper.

`.github/workflows/ci.yml` runs the same sequence — typecheck, lint,
Vitest, build, Playwright — against a real `postgres:16` service
container on every push/PR, so CI is verifying the exact commands a
developer runs locally, not a separate CI-only path.

## Deployment & monitoring

- **Database**: Postgres via Supabase, accessed through two Prisma
  datasource URLs — `DATABASE_URL` is Supabase's pooled pgbouncer
  connection (every runtime query), `DIRECT_URL` is the direct connection
  (`prisma migrate`, which needs real DDL/advisory-lock support pgbouncer's
  transaction pooling mode doesn't provide). Schema changes go through real
  Prisma Migrate history (`prisma/migrations/`), not `prisma db push` —
  `db push` was used through Phase 13 for fast iteration but has no
  migration history and isn't safe against a real production database.
- **App hosting**: Vercel. `package.json`'s `vercel-build` script
  (`prisma migrate deploy && next build`) is Vercel's auto-detected build
  command override, so every deploy applies pending migrations before
  building. `postinstall: "prisma generate"` keeps the generated client in
  sync on every fresh install (Vercel's build, Docker's `deps` stage, a
  contributor's first `npm install`).
- **Error reporting**: Sentry (`@sentry/nextjs`) across server, edge, and
  client runtimes (`instrumentation.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts`, `instrumentation-client.ts`), plus
  `app/global-error.tsx` for uncaught React render errors. Every init call
  is DSN-gated (`enabled: Boolean(process.env.SENTRY_DSN)`), so
  environments without a configured DSN — local dev, CI, this sandbox —
  run with reporting cleanly disabled instead of erroring.
- **Structured logging**: `lib/logger.ts` — leveled JSON log lines
  (`{level, message, timestamp, ...meta}`); `.error()` also reports to
  Sentry. Every API route's error handling and
  `lib/integrations/webhooks.ts`'s best-effort dispatch failures go through
  this instead of raw `console.error`, so a production Sentry project
  receives every one of them automatically once `SENTRY_DSN` is set — no
  route-by-route wiring needed beyond what's already there.
- **Containerization**: `Dockerfile` (three-stage: `deps` → `builder` →
  `runner`) builds on `next.config.ts`'s `output: "standalone"` for a lean
  runtime image; `docker-compose.yml` adds a local Postgres plus one-off
  `migrate`/`seed` tooling services (built from the fuller `builder` stage,
  since they need the Prisma CLI the lean `runner` image deliberately
  doesn't ship). This is both a local dev-parity option and a self-hosting
  path if you don't want Vercel.
- See `DEPLOYMENT.md` for the actual step-by-step Vercel/Supabase/Sentry
  setup instructions.

## Folder structure

```
film-studio-classroom-ai/
├── app/
│   ├── (marketing) page.tsx, login/, unauthorized/
│   ├── api/
│   │   ├── auth/[...nextauth]/        NextAuth route handler
│   │   └── projects/generate/         curriculum engine entry point
│   ├── teacher/dashboard/, teacher/projects/[id]/
│   ├── student/dashboard/
│   ├── admin/dashboard/
│   ├── parent/dashboard/
│   └── mentor/dashboard/
├── components/
│   ├── ui/                            Button, Card, Field primitives
│   └── project-generator-form.tsx     feature component
├── lib/
│   ├── ai/                            provider abstraction + curriculum engine
│   ├── integrations/                  adapter framework
│   ├── constants/
│   ├── utils/
│   ├── auth.ts
│   ├── logger.ts                      structured logging + Sentry reporting
│   └── db.ts                          Prisma client singleton
├── prisma/
│   ├── schema.prisma
│   └── migrations/                    real Prisma Migrate history
├── skills/                            Agent Skills library (see README.md)
├── tests/
│   ├── unit/                          Vitest — pure logic, mocked fetch
│   ├── integration/                   Vitest — real local Postgres
│   └── e2e/                           Playwright — real browser + server
├── .github/workflows/ci.yml
├── Dockerfile, docker-compose.yml     containerized dev parity / self-hosting
├── instrumentation.ts, instrumentation-client.ts,
│   sentry.server.config.ts, sentry.edge.config.ts   Sentry wiring
├── middleware.ts
├── playwright.config.ts
├── vitest.config.ts
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── ROADMAP.md
```

## What's deliberately not built yet

Per the project brief's own instruction — build in phases, not one giant
response — the following are designed-for in the schema/architecture but
not yet implemented: digital portfolio *website* generation (the in-app
portfolio list exists; a public shareable site does not), Google Slides
export (Docs export works — see Phase 15 — but Slides' API needs a full
page/element request tree rather than Docs' single insertText call, a
meaningfully larger follow-up), OAuth connect UI polish for Canvas/
Schoology/Blackboard/Vimeo/Frame.io beyond the generic authorize/callback
flow Phase 15 built (each vendor's authorize endpoint is implemented from
its documented pattern but only Google's flow — Classroom, Workspace,
YouTube — has been verified against a real account), and billing/district
multi-tenancy (a district-hierarchy respec was evaluated in Phase 15 and
deliberately not pursued — see that phase's notes for the reasoning). See
`ROADMAP.md` for the phase-by-phase status and the reasoning behind each
of these scope decisions.

Automated roster reconciliation and the OAuth authorize/callback UI —
both previously listed here as not-yet-built — now exist for Google
Classroom specifically (Phase 15): `lib/roster-sync.ts` turns a fetched
roster into real `Enrollment` rows, and `/admin/dashboard/integrations`
has working Connect/Disconnect buttons rather than static status text.
Infinite Campus's roster fetch still only previews (its adapter returns
the same `SisRosterSection` shape `lib/roster-sync.ts` consumes, so
wiring its preview into the same reconciliation function is a small
follow-up, not a redesign).

Also out of scope by design, not oversight: visual diagram generation
(camera diagrams, lighting diagrams, floor plans, blocking, animatics) and
actual poster/trailer images. AI Film Studio (Phase 8) describes those in
prose instead of inventing an image — producing real diagrams/images needs
an image-generation integration (Adobe Firefly, DALL-E) this app doesn't
have wired up.

Equipment checkout now has a real QR-based flow (Phase 4): the QR encodes
the asset tag, and a school's existing USB/handheld barcode scanner can
type it straight into the checkout page's input — no camera API or native
app needed.
