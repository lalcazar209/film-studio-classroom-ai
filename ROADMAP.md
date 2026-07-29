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

## Phase 4 — Teacher Portal ✅
- [x] Hand-editing for every AI-generated artifact: `/teacher/projects/[id]/edit`
      lets a teacher rewrite lesson objectives/"I can" statements/
      differentiation, rubric criteria and weights, and quiz prompts/answers
      — generation is a starting point, never the final word
      (`PATCH /api/projects/[id]`)
- [x] Attendance: `/teacher/dashboard/attendance/[classPeriodId]`, one-click
      P/A/T/E per student per day, upserts so re-marking a day never
      duplicates (`lib/attendance.ts`, `POST /api/attendance`)
- [x] Gradebook: `/teacher/dashboard/gradebook/[classPeriodId]`, a
      student x project grid with inline auto-saving total + feedback per
      submission. Project generation now also creates a `Submission` row
      per enrolled student at generation time (see `curriculum-service.ts`)
      so the gradebook has something to show before anyone turns work in.
- [x] Equipment Manager: `/teacher/dashboard/equipment` — real QR codes
      (encoding the asset tag) generated server-side with the `qrcode`
      package, checkout/return flow with status transitions
      (`lib/equipment.ts`, `POST /api/equipment/[id]/checkout`,
      `POST /api/equipment/checkouts/[checkoutId]/return`). "Scanning" is a
      focused text input a USB/handheld barcode scanner can type into
      directly — no camera API needed for the common school hardware case.
- [x] Parent communication composer: `/teacher/dashboard/messages/[classPeriodId]`
      sends a `TeacherMessage` to a class period; parents see it on their
      dashboard via the `ParentLink -> student -> enrollment -> classPeriod`
      path. In-app only for now — outbound email/SMS delivery is an
      integration concern (Phase 10).
- [x] Analytics: `/teacher/dashboard/analytics` — real aggregate queries
      per class period (submission progress, grading progress, 30-day
      attendance rate, average grade), not mock numbers.
- [x] Fixed the admin dashboard org-scoping bug from Phase 3.
- [x] Verified against the real seeded database with an executable smoke
      test (`npm run test:smoke:phase4`, `scripts/smoke-test-phase4.ts`):
      11 assertions covering attendance recording + idempotent
      re-recording, equipment checkout/double-checkout-rejection/return,
      message visibility via the parent's exact query path, and grade
      persistence. Typecheck, lint, and build all pass clean.

Known gap carried forward: there's still no UI for a teacher to *create* a
ClassPeriod (only the seed script does today) — needed before Phase 4's
tools are usable end-to-end for a brand-new school. Folding into Phase 12
(Admin Portal CRUD) rather than growing Phase 4 further.

## Phase 5 — Student Portal ✅
- [x] Assignment view + submission flow: `/student/projects/[id]` shows the
      week's lessons/rubric and a submission form (video *link* for now —
      real file upload needs the Cloudinary pipeline in Phase 6; a student
      pastes a YouTube/Vimeo/Drive URL today). `PATCH /api/submissions/[id]/submit`
      (`lib/submissions.ts`).
- [x] Digital Portfolio auto-archives on submission — not a separate step
      the student has to remember. Submitting work upserts a
      `PROJECT_ARCHIVE` `PortfolioItem` in the same transaction as the
      submission update. `/student/dashboard/portfolio` lists everything.
- [x] Resume Builder (`/student/dashboard/resume`): AI-generated from the
      student's completed project history via `lib/ai/resume-service.ts`,
      same generate-validate-persist pattern as the curriculum engine
      (Zod schema, one living resume per student, regenerate any time).
- [x] Demo Reel Builder (`/student/dashboard/demo-reel`): a curation tool,
      not video processing — students pick and order their own submitted
      clips into a named reel (`lib/demo-reel.ts`). Ownership is enforced
      (can't include a clip that isn't your own submission).
- [x] AI Tutor (`/student/dashboard/tutor`, `TutorMessage` model,
      `lib/ai/tutor-service.ts`): system prompt is directly grounded in
      `skills/education/ai-learning-science/adaptive-hint-sequence-designer`
      (cascading hints, never the answer first), `intelligent-tutoring-dialogue-designer`
      (Socratic, mixed-initiative dialogue), and `ai-feedback-design-principles`
      (specific, task-focused feedback, not generic praise) — cited inline
      in the service file, not paraphrased from memory.
- [x] Verified against the real seeded database with an executable smoke
      test (`npm run test:smoke:phase5`, `scripts/smoke-test-phase5.ts`):
      10 assertions covering the submission -> portfolio-archive cascade,
      archive upsert on resubmission, rejecting submission of someone
      else's work, demo reel ownership enforcement, and demo reel upsert.
      The AI-dependent flows (resume generation, tutor replies) need a
      real `ANTHROPIC_API_KEY` and aren't exercised by this offline smoke
      test; `resumeContentSchema` was verified separately against a
      sample payload. Typecheck, lint, and build all pass clean.

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
