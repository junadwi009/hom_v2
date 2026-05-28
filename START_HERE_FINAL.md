# START HERE — HOM Studio OS v2 Final Codex Execution Pack

This is the consolidated and final execution package for rebuilding HOM Studio OS v2.

## Final Decision

Build HOM Studio OS v2 as an AI-governed Clinical Studio Operating System, not as a generic booking app.

Locked stack:

```text
Core App: Next.js + React + TypeScript
Database/Auth/Storage/Vector: Supabase + Postgres + pgvector
Frontend Hosting: Vercel
Backend API/Worker: Render
Queue/Cache: Render Key Value/Redis or Postgres event_outbox + pg-boss
AI: Centralized AI Gateway
UI: Code-first design system with shadcn/ui, Radix UI, Motion.dev, Storybook
Python: Not in Phase 1. Optional FastAPI later for heavy document/AI workers.
Flask: Not used as core backend.
n8n: Not used as core dependency.
```

## How to Use This Package

1. Read `QUICKSTART_FOR_BEGINNERS.md` first.
2. Read `docs/00_MASTER_CONTEXT_FOR_CODEX.md`.
3. Read `docs/20_ROBUST_STACK_DECISION.md` and `docs/24_TECH_STACK_LOCKFILE.md`.
4. Give Codex the prompt in `codex/CODEX_MASTER_EXECUTION_PROMPT.md`.
5. Execute only Phase 0 and Phase 1 first.
6. Do not let Codex jump to AI, WhatsApp, finance automation, or production deployment before the foundation is stable.

## Most Important Rule

Build the operational foundation first:

```text
users → roles → clients → practitioners → services → appointments → audit logs → base UI
```

Only after that continue to:

```text
clinical notes → finance → WhatsApp → Knowledge Studio → AI Gateway → behavior intelligence → executive dashboard
```

## Files to Prioritize

```text
docs/00_MASTER_CONTEXT_FOR_CODEX.md
docs/01_PRD.md
docs/02_SYSTEM_BLUEPRINT.md
docs/03_ARCHITECTURE_DECISIONS.md
docs/12_STEP_BY_STEP_EXECUTION_PLAN.md
docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md
docs/23_CODEX_RULES_ROBUST_STACK.md
docs/24_TECH_STACK_LOCKFILE.md
codex/CODEX_MASTER_EXECUTION_PROMPT.md
```

## Important Warning

Do not rebuild this as a beautiful dashboard first. A beautiful dashboard without reliable data, permissions, audit logs, and appointment logic will fail operationally.

