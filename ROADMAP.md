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

## Phase 6 — Media pipeline ✅
- [x] Cloudinary integration for real video uploads: the browser uploads
      the file *directly* to Cloudinary using a server-signed request
      (`lib/integrations/cloudinary.ts`, `POST /api/uploads/sign`) — video
      bytes never pass through our server/serverless function, so there's
      no Next.js body-size limit to hit. `components/video-upload.tsx`
      shows real upload progress via `XMLHttpRequest`. The submission form
      still accepts a pasted link too (YouTube/Vimeo/Drive) for students
      whose video already lives elsewhere.
- [x] AI Video Review (`lib/ai/video-review-service.ts`,
      `POST /api/submissions/[id]/review`, `/teacher/projects/[id]/submissions`):
      follows the curriculum-service.ts generate-validate-persist pattern,
      scored against `videoReviewSchema` (storytelling, composition,
      lighting, exposure, white balance, audio, editing, pacing, graphics,
      professionalism, copyright concerns, accessibility notes).
- [x] To make the review genuinely see the video rather than guess from a
      title: `lib/ai/provider.ts` grew multipart message support
      (`AIContentBlock`: text | base64-image), implemented in all three
      providers (Anthropic image blocks, OpenAI `image_url` parts, Gemini
      `inlineData` parts). Cloudinary generates video-frame JPEG
      thumbnails on the fly via URL transformation
      (`getVideoThumbnailUrls`) — no separate extraction job — and those
      frames are fetched and attached to the review request. For
      non-Cloudinary video links (pasted YouTube/Vimeo URLs) there are no
      frames to extract, so the review honestly falls back to metadata-only
      analysis and says so (`analyzedVisualFrames: false`), rather than
      inventing visual detail it can't see.
- [x] Verified against the real seeded database *and* a real HTTP
      round-trip (`npm run test:smoke:phase6`, `scripts/smoke-test-phase6.ts`):
      11 assertions covering the Cloudinary signature against an
      independently-reimplemented reference algorithm, thumbnail URL
      construction (and correctly returning `null` for non-Cloudinary
      URLs), a throwaway local HTTP server proving `fetchImageAsDataUri`
      round-trips real bytes into a valid base64 data URI, and
      `videoReviewSchema` validating a realistic payload. The AI call
      itself needs a real `ANTHROPIC_API_KEY`/network access and isn't
      exercised offline, consistent with Phases 4-5. Typecheck, lint, and
      build all pass clean.

## Phase 7 — Video Academy ✅
- [x] Instructional video generator (`lib/ai/video-academy-service.ts`,
      `TutorialVideo` model, `POST /api/video-academy/generate`): one
      topic becomes a teacher script, timed narration/shot-list segments
      (with visual guide, shot type, graphics/animation notes), a practice
      activity, and an embedded quiz — same generate-validate-persist
      pattern as `curriculum-service.ts`.
- [x] Transcript and SRT captions are **computed, not AI-generated** —
      `lib/captions.ts` derives both deterministically from the segment
      timestamps/narration, so they can never drift out of sync with what
      the narration actually says or have malformed SRT syntax. Downloadable
      via `GET /api/video-academy/[id]/transcript` and `.../captions`.
- [x] Shared library per organization: `/teacher/dashboard/video-academy`
      (generate + browse) and `/student/dashboard/video-academy`
      (read-only, learner-facing framing of the same content).
- [x] Verified with `npm run test:smoke:phase7`
      (`scripts/smoke-test-phase7.ts`): 8 assertions covering transcript
      joining, SRT timestamp formatting (including sub-second precision
      and the hours field beyond 60 minutes), segment
      end-before-start rejection, and a realistic bundle validating
      against `tutorialVideoBundleSchema`. Typecheck, lint, and build all
      pass clean.

## Phase 8 — AI Film Studio & AI Assistants ✅
- [x] All 19 AI Assistants from the project brief as a registry
      (`lib/ai/assistants.ts`) — Director, Producer, Screenwriter, Editor,
      Colorist, Cinematographer, Lighting Designer, Audio Engineer, Drone
      Instructor, Broadcast Coach, Animation Coach, Motion Graphics Coach,
      Acting Coach, Film History, Career Coach, Portfolio Coach, SkillsUSA
      Coach, College Advisor, Internship Advisor. Each has a genuinely
      distinct, substantive system prompt reflecting real domain practice
      (e.g. Drone Instructor AI leads with FAA Part 107 compliance;
      Colorist AI talks in waveforms/vectorscopes) — not one generic bot
      with a name swapped in. Chat persists per (user, assistant) via the
      new `AssistantMessage` model, available to teachers, students, and
      mentors at `/{role}/dashboard/assistants[/id]`
      (`lib/ai/assistant-chat-service.ts`,
      `POST /api/assistants/[id]/messages`).
- [x] AI Film Studio (`lib/ai/film-studio-service.ts`, `FilmStudioProject`
      model, `POST /api/film-studio/generate`,
      `/{teacher,mentor}/dashboard/film-studio`): standalone production
      packages (not tied to a ClassPeriod's weekly cycle) covering
      screenplay, shot list, call sheet, budget, equipment list, location
      plan (flagging which locations need permits), casting sheet, and a
      marketing plan with poster/trailer concepts described in prose.
- [x] Honest scope limit, stated in the schema comments and here rather
      than silently skipped: camera diagrams, lighting diagrams, floor
      plans, blocking diagrams, animatics, and actual poster/trailer
      **images** are not generated — those need an image-generation
      integration (Adobe Firefly / DALL-E) this app doesn't have wired up
      yet. The marketing plan describes the poster/trailer concept in
      prose instead of inventing a fake image.
- [x] Verified with `npm run test:smoke:phase8`
      (`scripts/smoke-test-phase8.ts`): 12 assertions covering registry
      completeness (all 19), id uniqueness, prompt distinctness (every
      system prompt is unique, not template-filled), two spot-checks that
      prompts reflect real domain content, a real DB round-trip proving
      `AssistantMessage` history is correctly scoped per (user, assistant)
      pair, and `filmStudioBundleSchema` validating a realistic bundle
      and rejecting one with a missing required field. Typecheck, lint,
      and build all pass clean.

## Phase 9 — SkillsUSA Mode ✅
- [x] Competition practice generator (`lib/ai/skillsusa-service.ts`,
      `SkillsUsaPractice` model, `POST /api/skillsusa/generate`,
      `/{teacher,student}/dashboard/skillsusa`): one contest name becomes
      a timed challenge scenario, a formative teacher rubric, a
      point-based competition-day judge sheet, a mock competition
      schedule, and a bank of 3+ additional practice scenarios.
      `contestName` is free text, not a hardcoded enum — SkillsUSA's
      exact contest roster varies by state/year and we don't assert a
      list we can't guarantee is current.
- [x] Judge sheets are deliberately a separate artifact from the rubric:
      the rubric is formative coaching feedback, the judge sheet is a
      numeric point-based scoring instrument matching how a real
      competition judge scores, with `maxPoints` per criterion summing to
      `totalPossiblePoints`.
- [x] Timed challenges are genuinely interactive, not just described text:
      `components/countdown-timer.tsx` is a real start/pause/reset
      countdown timer students can run against the AI-generated time
      limit while practicing.
- [x] Verified with `npm run test:smoke:phase9`
      (`scripts/smoke-test-phase9.ts`): 5 assertions covering schema
      validation of a realistic bundle, rejecting fewer than 3 practice
      scenarios, rejecting a non-positive time limit, and a real Postgres
      round-trip proving nested JSON (the judge sheet's point totals)
      survives persistence intact. Typecheck, lint, and build all pass
      clean.

## Phase 10 — Integrations beyond Google Classroom ✅
- [x] Canvas, Schoology, Blackboard: real `IntegrationAdapter` implementations
      (`lib/integrations/{canvas,schoology,blackboard}.ts`) — OAuth2
      authorization-code flow, per-institution base URL (all three are
      typically self-hosted per school, unlike Google's single global
      host). Registered in `registry.ts`.
- [x] Infinite Campus: added as a genuinely different integration shape,
      not forced into the LMS adapter interface. Infinite Campus is a
      **Student Information System**, not an LMS — there's no
      "assignment" to push, so `lib/integrations/sis-adapter.ts` defines
      a separate `SisAdapter` contract (`fetchRoster`, `pushGrade`)
      implemented by `infinite-campus.ts`. Credentials are
      district-issued (API key/secret per Campus instance), configured
      per-organization at `/admin/dashboard/integrations` rather than via
      a self-serve OAuth app, which matches how districts actually
      provision Campus API access. A working "Preview roster" action
      calls the real adapter and shows section/student counts — full
      roster auto-reconciliation into Enrollment records is a follow-up,
      not built yet.
- [x] YouTube, Vimeo, Frame.io: another distinct shape —
      `lib/integrations/video-host-adapter.ts` (`VideoHostAdapter`,
      `uploadVideo`) rather than the LMS or SIS contracts, since these
      publish/share video rather than manage coursework. YouTube reuses
      the Google OAuth client (upload-scoped) already used for Classroom;
      Vimeo and Frame.io both use their real "pull/remote upload"
      capability to fetch from a URL (the Cloudinary secure_url) instead
      of streaming bytes through our server. Frame.io is treated as this
      app's practical "Adobe Creative Cloud" integration, since Adobe's
      developer APIs are product-specific and Frame.io (now part of
      Creative Cloud) is the product that matches "share a cut for
      review" — documented as a deliberate scope decision, not an
      oversight.
- [x] Slack and Zapier/Make: push-style integrations via
      `lib/integrations/webhooks.ts` — an org admin pastes a webhook URL
      (Slack Incoming Webhook, or a Zapier/Make catch-hook), and
      `dispatchWebhookEvent` POSTs to it. Wired into a real trigger:
      generating a Project now fires a `project.generated` event to any
      configured Slack/Zapier integration. Dispatch is best-effort — a
      broken webhook is logged, never allowed to fail the action that
      triggered it.
- [x] `/admin/dashboard/integrations`: connection status for every
      provider, working configuration forms for Slack/Zapier (webhook
      URL) and Infinite Campus (base URL + API key/secret, plus the
      roster preview action); OAuth-based providers (Canvas, Schoology,
      Blackboard, YouTube, Vimeo, Frame.io) show configuration status
      from env vars — the adapters are fully implemented and ready, but
      the OAuth authorize/callback route pairs to drive the actual
      "Connect" button per provider are a follow-up (6 near-identical
      OAuth dances), not built this phase.
- [x] Verified with `npm run test:smoke:phase10`
      (`scripts/smoke-test-phase10.ts`): 16 assertions covering registry
      resolution (including that an unregistered provider throws instead
      of silently no-op'ing, and that Infinite Campus resolves from the
      SIS registry rather than the LMS one), real HTTP round-trips
      proving the Slack `{text}` payload shape and the raw-JSON Zapier
      payload shape, that a broken webhook URL is swallowed rather than
      thrown, and — against a real local HTTP server standing in for
      Campus — that roster requests are correctly Basic-authenticated and
      the section/student JSON maps through intact. Live OAuth exchanges
      against the real vendor APIs need live credentials and aren't
      exercised offline, consistent with every AI-provider call in prior
      phases. Typecheck, lint, and build all pass clean.

## Phase 11 — Export pipeline ✅
- [x] PDF export (`lib/export/project-pdf.tsx`, `@react-pdf/renderer`,
      `GET /api/projects/[id]/export/pdf`): real, downloadable PDF of the
      full teacher guide (all 5 lessons, rubric, quiz, vocabulary) — no
      headless browser needed.
- [x] Word export (`lib/export/project-docx.ts`, the `docx` package,
      `GET /api/projects/[id]/export/docx`): same content as a real,
      editable .docx.
- [x] PowerPoint export (`lib/export/project-pptx.ts`, `pptxgenjs`,
      `GET /api/projects/[id]/export/pptx`): title slide + one slide per
      lesson day with objective and agenda bullets — matches "Generating
      one lesson automatically generates: Slides" from the project brief.
- [x] Gamma.app export (`lib/export/gamma.ts`, Gamma's public Generate
      API — submit an outline, poll until complete, get a shareable
      Gamma URL) for both Project and Video Academy tutorials
      (`POST /api/projects/[id]/export/gamma`,
      `POST /api/video-academy/[id]/export/gamma`), with a real
      start/poll-until-done UI (`components/gamma-export-button.tsx`).
      Note: generation currently runs synchronously inside the request
      (polling for up to ~2 minutes) — moving this to a background job so
      it doesn't risk a serverless function timeout is a follow-up, not
      done this phase.
- [x] Google Docs export (`lib/export/google-docs.ts`): real Drive +
      Docs API calls (create document, insert content) are implemented
      and ready, but the `GOOGLE_WORKSPACE` OAuth connection flow that
      would obtain the docs/drive-scoped access token isn't wired up yet
      — stated honestly as a follow-up rather than shipping a
      half-connected "Export to Google Docs" button. Google Slides export
      was scoped out for the same reason (Slides' batchUpdate API is
      substantially more complex than Docs' single text-insert call).
- [x] Certificates/posters via `skills/app-web-builder/canvas-design`
      were not built this phase either — that's a static-image-generation
      skill meant to be invoked by an agent authoring a design, not a
      library this Next.js app can call at request time. Deferred to
      whichever phase builds the Digital Portfolio website / Certificates
      feature, where it's actually the right tool.
- [x] Verified with `npm run test:smoke:phase11`
      (`scripts/smoke-test-phase11.ts`): 11 assertions that **actually
      render real files** against real seeded project data (not just "did
      it not throw") — PDF starts with the `%PDF-` magic bytes, .docx and
      .pptx both start with the `PK` ZIP signature real OOXML files
      require, all three are non-trivial file sizes, and the Gamma/Google
      Docs deterministic text-building helpers produce correct output
      from a project's lessons/brief. The Gamma and Google Docs *API
      calls* themselves need live credentials and aren't exercised
      offline, consistent with every external AI/vendor call in prior
      phases. Typecheck, lint, and build all pass clean.

## Phase 12 — Admin Portal ✅
- [x] Class period CRUD (`lib/class-periods.ts`,
      `/admin/dashboard/class-periods[/id]`): finally closes the gap
      flagged back in Phase 4 — an admin can create, edit, and manage
      the roster for a class period, not just via the seed script.
      Deletion is guarded: a class period with any enrollments or
      generated projects can't be deleted (that history has to stay
      intact), only an empty one can.
- [x] Roster management: enroll/unenroll students per class period
      (`POST`/`DELETE /api/class-periods/[id]/enrollments`), usable by
      the owning teacher or an admin.
- [x] User management (`lib/user-management.ts`,
      `/admin/dashboard/users`): change any user's role, activate/
      deactivate an account. Deactivating keeps all history (submissions,
      grades, attendance) intact — it blocks sign-in
      (`middleware.ts` checks `session.user.isActive`, redirects to
      `/account-disabled`) rather than deleting or unlinking the user.
      Guarded: you can't deactivate your own account, and the sole
      remaining admin in an org can't demote themselves — someone has to
      stay able to run the school.
- [x] School settings (`/admin/dashboard/settings`): edit org name,
      district, CDS code.
- [x] Reporting (`lib/reports.ts`, `/admin/dashboard/reports`): real CSV
      exports — full roster (student/class period/teacher), and a
      standards-coverage report showing which California CTE/VAPA/ISTE
      standards the org's generated projects have actually touched,
      tying back to the Standards Engine from Phase 2.
- [x] Verified with `npm run test:smoke:phase12`
      (`scripts/smoke-test-phase12.ts`): 14 assertions against the real
      seeded database covering class period create/update, rejecting a
      non-teacher as a class period's teacher, rejecting deletion of a
      class period with enrollments, enroll/unenroll round-tripping the
      Enrollment row, deletion succeeding once history is clear, role
      changes, the self-demotion guard (only triggers when the acting
      admin really is the sole admin — verified by promoting then
      demoting a second admin around the assertion), the
      self-deactivation guard, and both CSV reports' header rows and
      content. Typecheck, lint, and build all pass clean.

## Phase 13 — Testing & CI/CD ✅
- [x] Vitest set up (`vitest.config.ts`, `tests/setup.ts`) with a
      unit/integration split: `npm run test:unit` runs `tests/unit/**`,
      `npm run test:integration` runs `tests/integration/**`, `npm run
      test` runs both. All three are invoked via `node --env-file=.env
      ./node_modules/.bin/vitest run ...` — the same pattern established
      in Phase 6 for any non-Prisma script that needs env vars, since
      Prisma Client's own dotenv side effect only fires once a
      `PrismaClient` is instantiated.
- [x] Vitest unit tests for `lib/ai/schemas.ts` validation
      (`tests/unit/schemas.test.ts`): both accept- and reject-path
      assertions for `projectBundleSchema`, `videoReviewSchema`,
      `tutorialSegmentSchema`, `tutorialVideoBundleSchema`,
      `filmStudioBundleSchema`, and `skillsUsaBundleSchema` — fewer than 5
      lessons/vocab terms, an invalid lesson-day enum, a score outside
      1–10, an empty `nextSteps`, `endSeconds` before `startSeconds`,
      fewer than 3 tutorial segments/SkillsUSA scenarios, a non-positive
      time limit. Also unit-tests the pure transforms `lib/captions.ts`
      (`segmentsToTranscript`/`segmentsToSrt`, including exact SRT
      timestamp formatting and hour rollover) and
      `lib/utils/{slugify,cn}.ts`.
- [x] Vitest unit tests for `lib/integrations/*` adapters, mocked
      (`tests/unit/integrations/{canvas,infinite-campus}.test.ts`) via
      `vi.stubGlobal("fetch", vi.fn())` / `vi.unstubAllGlobals()`:
      verifies the exact request shape sent to each vendor (Canvas's
      `grant_type=authorization_code` token exchange and Bearer-token
      assignment POST; Infinite Campus's HTTP Basic auth header built
      from the district's key/secret and its roster/grade-passback
      payload shapes), a non-2xx response throwing rather than failing
      silently, and `CanvasAdapter` refusing to construct without a base
      URL.
- [x] Vitest integration tests against the real local Postgres instance
      (`tests/integration/*.test.ts`, via `PrismaClient` directly against
      the seeded `demo-org`), reusing assertions already proven correct
      in the Phase 4–12 `scripts/smoke-test-*.ts` scripts but formalized
      into `describe`/`it` with proper `beforeEach`/`afterEach` teardown
      so runs are repeatable: webhook dispatch (Slack/Zapier payload
      shapes, dispatch to both, a broken webhook's fetch rejection
      swallowed rather than thrown), class-period CRUD and its deletion
      guard, user role/active management and both self-protection guards,
      submission archiving and demo-reel ownership checks, the full
      invite lifecycle (including the parent-invite/`ParentLink` path and
      email-mismatch rejection), CSV report headers/content/escaping, and
      the export pipeline actually rendering real files (`%PDF-` magic
      bytes, `PK` OOXML signature for `.docx`/`.pptx`) plus the
      deterministic Gamma/Google-Docs outline builders.
- [x] Playwright e2e for the project-generation vertical slice
      (`playwright.config.ts`, `tests/e2e/`): a real Auth.js database
      session is created directly in Postgres for the seeded demo
      teacher (the same mechanism NextAuth uses after a real OAuth
      callback — a `Session` row plus a matching `authjs.session-token`
      cookie) and saved as Playwright storage state in
      `globalSetup`/`globalTeardown`, so the browser is genuinely
      logged in rather than bypassing auth. The one thing stubbed is the
      outbound AI call itself, since no `ANTHROPIC_API_KEY` exists in
      this environment: the test creates a real Project (with a lesson)
      directly via Prisma, intercepts the browser's `POST
      /api/projects/generate` with `page.route()` to return that
      project's id, then drives the actual form (title/brief fields,
      submit button) and asserts the resulting `/teacher/projects/[id]`
      page — a real server-rendered page reading real Postgres data —
      shows the generated title and lesson. This caught a real bug: `auth()`
      in `middleware.ts` uses the Prisma database-session adapter, and
      Prisma Client cannot run on Next's default Edge middleware runtime
      without Accelerate/driver adapters (`PrismaClientKnownRequestError`
      surfaced as an `AdapterError`/`SessionTokenError` on every
      middleware-gated request). None of the prior phases' smoke tests
      caught this because they called library functions directly and
      never sent a real HTTP request through `middleware.ts`. Fixed by
      adding `export const config = { runtime: "nodejs", matcher: [...] }`
      to `middleware.ts` — Next.js 15.5's stable Node.js middleware
      runtime, which runs the same Prisma Client every route handler
      already uses.
- [x] GitHub Actions (`.github/workflows/ci.yml`): on every push to
      `main` and every PR — spins up a real `postgres:16` service
      container, `prisma generate`/`db push`/`db seed`, then typecheck,
      lint, the full Vitest suite (unit + integration, against the
      service container), `next build`, and the Playwright e2e suite
      (installing Chromium via `playwright install --with-deps`), with
      the Playwright HTML report uploaded as a build artifact on failure.
      All env vars are dummy/non-secret CI values matching `.env.example`
      — no real credentials are needed since every external vendor call
      is either mocked (unit) or simply not exercised (build/e2e use the
      stubbed AI path, matching local dev).
- [x] Verified for real: `npx tsc --noEmit` passes clean across the
      entire codebase including every new test file; `npx eslint .` and
      `npx next build` both pass clean; `npm run test` passes all 74
      Vitest tests (34 unit + 40 integration) against the real local
      Postgres instance; `npx playwright test` passes the e2e spec
      against a real `next dev` server. The GitHub Actions workflow
      mirrors this same sequence and hasn't been run on GitHub's runners
      (no push access to trigger Actions from this environment beyond
      the PAT-based `git push` used for every phase), but every step it
      runs is the exact command just verified locally.

## Phase 14 — Deployment & monitoring ✅
- [x] Vercel project + Supabase production instance: the codebase is
      deploy-ready and every step is documented in `DEPLOYMENT.md`, but no
      actual Vercel/Supabase account exists in this environment to click
      "Create Project" in — same honest boundary as every phase's live AI
      calls or the Gamma/Google Docs APIs, which also need real accounts
      this sandbox doesn't have. What's real and verified:
      - `prisma/schema.prisma`'s `datasource` now splits `url`
        (`DATABASE_URL`, Supabase's pooled pgbouncer connection) from
        `directUrl` (`DIRECT_URL`, the direct connection `prisma migrate`
        needs for DDL/advisory locks pgbouncer's transaction-pooling mode
        doesn't support) — the standard Prisma+Supabase production
        pattern.
      - The project moved off `prisma db push` (fine for the rapid
        phase-by-phase build, but no migration history and unsafe against
        a real production database) onto real Prisma Migrate: the entire
        schema was baselined into `prisma/migrations/20260729045821_init/`
        via `prisma migrate diff --from-empty` and marked applied against
        the existing dev database with `prisma migrate resolve --applied`
        — verified with `prisma migrate status` (clean) and
        `prisma migrate deploy` (idempotent, no pending migrations) right
        after. Every migration from here forward goes through
        `npm run db:migrate` (`prisma migrate dev`) like a normal project.
      - `package.json` gained `postinstall: "prisma generate"` (so a
        fresh `npm install`/`npm ci` — including Vercel's build and
        Docker's `deps` stage — always has a matching client) and
        `vercel-build: "prisma migrate deploy && next build"` — Vercel
        auto-detects and runs this script instead of `next build` when
        present, so every deploy applies pending migrations before
        building.
- [x] Error reporting (Sentry) + structured logging:
      - `@sentry/nextjs` wired in per the current (Next.js 15 App Router)
        convention: `instrumentation.ts` (registers
        `sentry.server.config.ts`/`sentry.edge.config.ts` by
        `NEXT_RUNTIME`, plus `onRequestError`), `instrumentation-client.ts`
        (browser init + router-transition instrumentation),
        `app/global-error.tsx` (catches uncaught React render errors),
        and `next.config.ts` wrapped with `withSentryConfig` for
        source-map upload (skipped gracefully without `SENTRY_AUTH_TOKEN`,
        which is exactly the case in this sandbox/CI). Every init call
        checks for a DSN and sets `enabled: false` without one, so local
        dev/CI/this sandbox — none of which have a real Sentry project —
        run with reporting cleanly disabled rather than failing.
      - `lib/logger.ts`: a small structured JSON logger
        (`{level, message, timestamp, ...meta}`) whose `.error()` also
        calls `Sentry.captureException`/`captureMessage`. This isn't a
        built-and-never-used utility — every one of the 26 existing
        `console.error(...)` call sites across the API routes and
        `lib/integrations/webhooks.ts` was swept to `logger.error(...)`,
        confirmed by grepping for `console.error` afterward (zero
        remaining outside `lib/logger.ts` itself) and by the Vitest
        integration suite's webhook test actually printing a real
        structured JSON log line during the run.
      - `middleware.ts` needing the Node.js middleware runtime (from
        Phase 13's e2e bug) is now also documented as a load-bearing
        constraint in `ARCHITECTURE.md` and `DEPLOYMENT.md`, since it's
        exactly the kind of thing that's easy to accidentally revert.
- [x] Docker Compose for local dev parity: `Dockerfile` (three-stage:
      `deps`/`builder`/`runner`, using `next.config.ts`'s new
      `output: "standalone"` for a lean runtime image, non-root user,
      Prisma's generated client/query-engine explicitly copied into the
      runner since Next's file-tracing doesn't reliably pick it up on its
      own) and `docker-compose.yml` (a `db` Postgres 16 service, `app`
      built from the `runner` stage, and `migrate`/`seed` one-off tooling
      services built from the fuller `builder` stage — kept out of the
      lean production image on purpose, since it needs the Prisma CLI and
      devDependencies the runtime image deliberately doesn't ship).
      Verified for real: `docker compose config` (both the default
      profile and `--profile tools`) parses and merges cleanly, including
      the `environment:`-over-`env_file:` precedence that repoints
      `DATABASE_URL`/`DIRECT_URL` at the `db` service hostname instead of
      `localhost`. The Docker *daemon* itself isn't reachable in this
      sandbox (`docker info` fails; starting it fails on a `ulimit`
      permission error that's a property of the sandbox, not the repo) —
      so the actual `docker compose up`/image build was not executed
      here. That's a real, stated limitation, not swept under the rug;
      everything short of the daemon itself (Dockerfile correctness,
      compose YAML validity, the standalone build the Dockerfile depends
      on) was checked as thoroughly as this environment allows.
- [x] Verified for real, end to end, after every change above:
      `npx tsc --noEmit`, `npx eslint .`, `npm run test` (all 74 Vitest
      tests), `npx next build`, and `npx playwright test` (the Phase 13
      e2e slice) all still pass clean — nothing in the deployment/
      monitoring work regressed the application itself.
