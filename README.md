# Film Studio Classroom AI

The Complete Educational Operating System for Film & Television Production.

This repo hosts the Agent Skills that power Film Studio Classroom AI's app/web
tooling, storyboard generation, and standards-aligned curriculum engine. Skills
follow the [Agent Skills specification](https://agentskills.io/specification.md)
(`SKILL.md` with YAML frontmatter) and are curated from external open-source
skill libraries — see [Attribution](#attribution) below.

## Skill Categories

### `skills/app-web-builder/` — App Creator & Web Designer
| Skill | Source | Purpose |
|---|---|---|
| `frontend-design` | anthropics/skills | Distinctive, intentional UI visual design |
| `web-artifacts-builder` | anthropics/skills | Multi-component React/Tailwind/shadcn app building |
| `webapp-testing` | anthropics/skills | Playwright-based testing of local web apps |
| `canvas-design` | anthropics/skills | Poster/certificate/badge static art generation |
| `saas-scaffolder` | alirezarezvani/claude-skills | Next.js/Drizzle/Stripe app boilerplate (Student/Teacher/Admin portals) |
| `senior-fullstack` | alirezarezvani/claude-skills | Next.js/FastAPI/Django scaffolding, code quality audits |
| `database-schema-designer` | alirezarezvani/claude-skills | ERD design, schema normalization, migrations |
| `ui-design-system` | alirezarezvani/claude-skills | Design tokens, component docs, dev handoff |
| `ux-researcher-designer` | alirezarezvani/claude-skills | Personas, journey maps, usability testing |
| `landing-page-generator` | alirezarezvani/claude-skills | Marketing/showcase pages (Next.js + Tailwind) |

### `skills/storyboarding/` — Storyboards
| Skill | Source | Purpose |
|---|---|---|
| `ai-video-storyboard` (repo root) | aicontentskills/ai-video-storyboard-skill | Brief → shot list, camera/lighting direction, production-ready prompts. Maps to Tuesday (pre-production) and Wednesday (production day) |

### `skills/education/` — Tutorials & Educational Content
Curated from 165 evidence-based skills in `GarethManning/education-agent-skills`.

| Domain | Skills | Maps to |
|---|---|---|
| `curriculum-alignment/` | coverage-audit, curriculum-crosswalk, developmental-band-translator, kud-chart-author | California CTE / VAPA / ISTE Standards Engine |
| `curriculum-assessment/` | backwards-design-unit-planner, criterion-referenced-rubric-generator, scope-and-sequence-designer, project-brief-designer, formative-assessment-technique-selector, differentiation-adapter, learning-progression-builder | AI Curriculum Builder, Project Generator, Rubric Builder, quizzes/exit tickets |
| `inclusive-design/` | udl-barrier-anticipator, udl-lesson-auditor, udl-options-designer | Differentiation, Accommodations, Extensions, Interventions |
| `explicit-instruction/` | explicit-instruction-sequence-builder, lesson-opening-designer, think-aloud-script-generator, practice-problem-sequence-designer, checking-for-understanding-protocol-designer | Monday project launch, Video Academy tutorials |
| `ai-learning-science/` | adaptive-hint-sequence-designer, intelligent-tutoring-dialogue-designer, ai-feedback-design-principles | AI Tutor, AI Assistants (Director AI, Editor AI, etc.) |

## Attribution

These skills are curated copies (not forks — see note below) from:

- **[anthropics/skills](https://github.com/anthropics/skills)** — Apache-2.0 / per-skill license (see each skill's `LICENSE.txt`)
- **[aicontentskills/ai-video-storyboard-skill](https://github.com/aicontentskills/ai-video-storyboard-skill)** — MIT
- **[GarethManning/education-agent-skills](https://github.com/GarethManning/education-agent-skills)** — CC BY-SA 4.0 (share-alike: derivatives of these skills must remain CC BY-SA 4.0)
- **[alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)** — MIT

Only a curated subset of each source repo was copied in (not the full repos).
Original repos should be consulted for updates; this is a point-in-time snapshot
adapted for this project's needs.

## Application

This repo also contains the Next.js 15 app itself — see
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the system design and
[`ROADMAP.md`](./ROADMAP.md) for what's built vs. planned.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, Google + AI provider keys
npx prisma generate
npx prisma db push     # or `npm run db:migrate` once you have a real Postgres instance
npm run dev
```

Phase 1 (architecture, schema, auth, and a working end-to-end "Project
Generator" vertical slice) is complete. Everything else — the full Teacher/
Student/Admin portals, equipment management, portfolio, SkillsUSA mode,
additional LMS integrations, exports, and deployment — is tracked
phase-by-phase in `ROADMAP.md`.
