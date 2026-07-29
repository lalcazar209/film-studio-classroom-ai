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
│   └── db.ts                          Prisma client singleton
├── prisma/schema.prisma
├── skills/                            Agent Skills library (see README.md)
├── middleware.ts
├── ARCHITECTURE.md
└── ROADMAP.md
```

## What's deliberately not built yet

Per the project brief's own instruction — build in phases, not one giant
response — the following are designed-for in the schema/architecture but
not yet implemented: digital portfolio *website* generation (the in-app
portfolio list exists; a public shareable site does not), automated SIS
roster reconciliation (Infinite Campus's roster preview works; turning
that into actual Enrollment records is manual today), the OAuth
authorize/callback UI for Canvas/Schoology/Blackboard/YouTube/Vimeo/
Frame.io (the adapters are fully implemented and ready — see Phase 10),
the `GOOGLE_WORKSPACE` connection Google Docs export needs, Google Slides
export, and billing. See `ROADMAP.md` for the phase-by-phase status and
the reasoning behind each of these scope decisions.

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
