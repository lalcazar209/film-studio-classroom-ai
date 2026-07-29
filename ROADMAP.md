# Roadmap

Tracks the 14-phase build-out from the project brief. Update this file in
the same commit/PR as the work it describes — it's the source of truth for
what's done vs. pending, not a separate planning doc that drifts.

## Phase 0 — Skill library ✅
- [x] Curated app/web-builder, storyboarding, and education skills into
      `skills/` from anthropics/skills, aicontentskills/ai-video-storyboard-skill,
      GarethManning/education-agent-skills, alirezarezvani/claude-skills.

## Phase 1 — Architecture, schema, folder structure ✅
- [x] `ARCHITECTURE.md`
- [x] `prisma/schema.prisma` — identity/RBAC, standards, projects/lessons,
      rubrics/quizzes/vocabulary, storyboards, production plans,
      submissions, equipment, portfolio, integration connections, AI job log
- [x] Next.js 15 App Router scaffold (TypeScript strict, Tailwind, ESLint) —
      builds and typechecks clean
- [x] NextAuth v5 (Google OAuth, database sessions, role claim on session)
- [x] Role-based route middleware
- [x] AI provider abstraction (Anthropic / OpenAI / Gemini) with lazy
      provider selection
- [x] Integration adapter framework + Google Classroom reference adapter
- [x] Vertical slice proving the core "generate once, cascade everywhere"
      pattern end-to-end: Project Generator UI → `/api/projects/generate` →
      `generateProjectBundle` → 5 lessons + rubric + quiz + vocabulary +
      storyboard + production plan persisted in one transaction → teacher
      dashboard + project detail page render real DB data
- [x] Minimal functional dashboards for all five roles (not stubs — real
      queries, no data yet because no seed data exists)

## Phase 2 — Database seeding & standards library ✅
- [x] Seed script (`prisma/seed.ts`): 14 California CTE AME standards
      (11 Foundation Standards + 3 Production and Managerial Arts pathway
      standards), 7 California VAPA Media Arts anchor standards (HS
      Proficient), and 7 ISTE Standards for Students — transcribed from
      official public sources, cited inline, not AI-invented. This is a
      curated subset, not the complete official documents; expanding it is
      an admin-tools task (Phase 12), and the curriculum engine
      auto-registers any additional codes the AI cites at generation time.
- [x] Seed script: demo Organization ("Riverside Media Arts Academy"), 1
      class period, 1 teacher, 1 admin, 1 mentor, 1 parent (linked to a
      student), 5 students, 6 equipment items
- [x] Verified against a real local Postgres 16 instance: `prisma db push`,
      `prisma db seed` (idempotent — re-running is a no-op), typecheck,
      lint, and build all pass clean

## Phase 3 — Auth hardening & onboarding ✅
- [x] Org bootstrap: a signed-in user with no organization can create one
      (`/onboarding` -> `POST /api/organizations` -> `lib/organizations.ts`)
      and becomes its ADMIN — the one role promotion in the system that
      doesn't require an invite, since someone has to be first
- [x] Invite model + `lib/invites.ts`: admins invite by email + role
      (`/admin/dashboard/invites` -> `POST /api/invites`); every other role
      promotion (TEACHER/ADMIN/MENTOR/PARENT) requires accepting a
      token-based invite tied to that exact email (`/invite/[token]`) —
      not self-service role claiming
- [x] Parent-to-student linking is verification-based: an admin/teacher
      picks the specific existing student when creating a PARENT invite;
      accepting it creates the `ParentLink` automatically. A parent can
      never link themselves to an arbitrary student.
- [x] Microsoft Entra ID and Apple sign-in providers, enabled only when
      their env vars are configured; `/login` renders a button per
      actually-enabled provider instead of hardcoding Google
- [x] Fixed a Phase-1 bug found while adding org-scoping: the admin
      dashboard's stats were counting across all organizations, not just
      the admin's own — now properly scoped by `organizationId`
- [x] Verified against the real seeded database with an executable smoke
      test (`npm run test:smoke:invites`, `scripts/smoke-test-invites.ts`):
      org-bootstrap rejection when already in an org, teacher invite
      create+accept, double-accept rejection, parent invite requires a
      valid studentId, wrong-email acceptance rejection, and correct
      `ParentLink` creation on accept — all 8 assertions pass

## Phase 4 — Teacher Portal
- [ ] Lesson Builder, Rubric Builder, Quiz Builder standalone editors (not
      just AI-generated — teachers must be able to hand-edit everything)
- [ ] Attendance, Gradebook
- [ ] Equipment Manager UI (checkout/return, QR scan flow)
- [ ] Parent communication composer
- [ ] Analytics dashboard

## Phase 5 — Student Portal
- [ ] Assignment view + submission flow (video upload)
- [ ] Digital Portfolio (auto-archive on project completion)
- [ ] Resume Builder, Demo Reel Builder
- [ ] AI Tutor chat surface (uses `skills/education/ai-learning-science/*`
      as prompting guidance)

## Phase 6 — Media pipeline
- [ ] Cloudinary integration for student video uploads
- [ ] AI Video Review (storytelling, composition, exposure, audio,
      accessibility feedback) — new AI service following the
      curriculum-service.ts pattern

## Phase 7 — Video Academy
- [ ] Instructional video generator (narration script, shot list, embedded
      quiz, captions/transcript) — reuses `lib/ai/schemas.ts` pattern

## Phase 8 — AI Film Studio & AI Assistants
- [ ] Per-assistant system prompts (Director AI, Producer AI, Screenwriter
      AI, Editor AI, Colorist AI, ...) as a registry, not one generic bot
- [ ] Screenplay/shot-list/call-sheet/budget generation

## Phase 9 — SkillsUSA Mode
- [ ] Competition practice generator, judge sheets, timed challenges

## Phase 10 — Integrations beyond Google Classroom
- [ ] Canvas, Schoology, Blackboard adapters (same `IntegrationAdapter`
      interface as `google-classroom.ts`)
- [ ] Adobe Creative Cloud / Frame.io, YouTube, Vimeo
- [ ] Zapier/Make, Slack

## Phase 11 — Export pipeline
- [ ] PDF / Docx / PPTX / Google Docs-Slides export of every generated
      artifact (uses `skills/app-web-builder/canvas-design` for
      certificates/posters)

## Phase 12 — Admin Portal
- [ ] Teacher/student/class CRUD, permissions, school settings, reporting

## Phase 13 — Testing & CI/CD
- [ ] Vitest unit tests for `lib/ai/schemas.ts` validation and
      `lib/integrations/*` adapters (mocked)
- [ ] Playwright e2e for the project-generation vertical slice
- [ ] GitHub Actions: typecheck, lint, test, build on every PR

## Phase 14 — Deployment & monitoring
- [ ] Vercel project + Supabase production instance
- [ ] Error reporting (Sentry) + structured logging
- [ ] Docker Compose for local dev parity
