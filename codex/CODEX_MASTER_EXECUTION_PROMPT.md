# Codex Master Execution Prompt — HOM Studio OS v2

You are working on HOM Studio OS v2, an AI-governed Clinical Studio Operating System for a clinical pilates/physio-informed studio.

Before writing code, read these files in order:

1. `START_HERE_FINAL.md`
2. `QUICKSTART_FOR_BEGINNERS.md`
3. `docs/00_MASTER_CONTEXT_FOR_CODEX.md`
4. `docs/01_PRD.md`
5. `docs/02_SYSTEM_BLUEPRINT.md`
6. `docs/03_ARCHITECTURE_DECISIONS.md`
7. `docs/12_STEP_BY_STEP_EXECUTION_PLAN.md`
8. `docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md`
9. `docs/23_CODEX_RULES_ROBUST_STACK.md`
10. `docs/24_TECH_STACK_LOCKFILE.md`

## Non-negotiable Architecture Rules

- Use Next.js + React + TypeScript as the core app.
- Use Supabase/Postgres as the source of truth.
- Use a modular monolith structure.
- Use selective hexagonal architecture for risky modules.
- Do not use Flask as core backend.
- Do not add FastAPI in Phase 1.
- Do not add n8n as a core dependency.
- Do not add microservices.
- Do not add VPS deployment.
- Do not hardcode secrets.
- Do not expose Supabase service role key to the client.
- Do not let AI directly modify appointments, finance, payroll, clinical notes, or approvals.
- Every sensitive action must have backend validation and audit logging.

## Execution Rules

- Use small, reviewable commits.
- Do not run destructive commands.
- Do not delete existing files unless explicitly instructed.
- Do not introduce paid APIs unless placed behind environment variables and documented.
- Every screen must include loading, empty, error, and success states.
- Every database migration must be reversible where possible.
- Every table containing sensitive data must have RLS policies.
- Every generated component must be refactored into reusable components.
- Build mock UI first, then connect API.

## Phase 0 Task

Set up the repository structure, docs, TypeScript strict mode, linting/formatting, basic Next.js shell, Supabase environment example, and CI skeleton.

Do not implement business modules yet.

## Phase 1 Task

Build the design system foundation and app shell:

- design tokens
- sidebar
- topbar
- layout
- reusable cards
- tables
- buttons
- forms
- status badges
- loading/empty/error states
- Storybook stories if Storybook is configured

Do not connect production data yet.

## Output Format for Each Task

For every implementation step, return:

1. Summary of changes
2. Files changed
3. How to run locally
4. Tests/checks run
5. Known limitations
6. Next recommended step

