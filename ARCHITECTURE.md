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

Adding a new AI Assistant (Director AI, Editor AI, Colorist AI, ...) means
adding a new schema + a new service function that calls `getAIProvider()`,
not a new provider integration.

### Third-party integrations (`lib/integrations/`)

- `adapter.ts` — the `IntegrationAdapter` interface (OAuth exchange, token
  refresh, `createAssignment`) every LMS/tool integration implements.
- `registry.ts` — maps `IntegrationProviderType` → adapter factory.
  Providers without an adapter yet throw a clear "not implemented" error
  instead of silently no-op'ing.
- `google-classroom.ts` — the reference implementation (OAuth2, courseWork
  creation). Canvas, Schoology, Blackboard, Adobe CC, YouTube, Zapier etc.
  follow the same shape (see ROADMAP.md Phase 10).

Integration credentials persist in `IntegrationConnection`, scoped per
`Organization`, never per-user — a school connects Google Classroom once,
every teacher in that org can push assignments through it.

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
portfolio list exists; a public shareable site does not), SkillsUSA
competition mode, most LMS adapters beyond Google Classroom, billing, and
admin CRUD for organizations/class periods/rostering (there's still no UI
to *create* a ClassPeriod outside the seed script). See `ROADMAP.md` for the
phase plan and current status.

Equipment checkout now has a real QR-based flow (Phase 4): the QR encodes
the asset tag, and a school's existing USB/handheld barcode scanner can
type it straight into the checkout page's input — no camera API or native
app needed.
