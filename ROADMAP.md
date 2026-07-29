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

## Phase 2 — Database seeding & standards library
- [ ] Seed script: California CTE AME + VAPA Media Arts + ISTE standard
      sets (real codes/descriptions, not AI-invented ones)
- [ ] Seed script: demo Organization, ClassPeriods, Users per role

## Phase 3 — Auth hardening & onboarding
- [ ] Admin invite flow (org creation, teacher invites, student rostering)
- [ ] Parent-to-student linking flow (verification, not self-service claim)
- [ ] Microsoft/Apple sign-in providers

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
