# Contributing to HOM Studio OS v2

Welcome. This project is being rebuilt carefully, one small step at a time, so a beginner solo developer can understand and maintain it.

## Start Here

Before changing code, read:

1. `START_HERE_FINAL.md`
2. `QUICKSTART_FOR_BEGINNERS.md`
3. `docs/00_MASTER_CONTEXT_FOR_CODEX.md`
4. `docs/20_ROBUST_STACK_DECISION.md`
5. `docs/23_CODEX_RULES_ROBUST_STACK.md`
6. `docs/24_TECH_STACK_LOCKFILE.md`
7. `AGENTS.md`

For frontend work, also read:

1. `docs/15_CODE_FIRST_UI_STRATEGY.md`
2. `docs/16_USER_JOURNEY_MAPS.md`
3. `docs/17_SCREEN_SPECIFICATIONS.md`
4. `docs/18_DESIGN_SYSTEM_WITHOUT_FIGMA.md`

## Current Repository State

This repository now contains the Phase 1 frontend foundation:

- pnpm workspace root.
- Next.js app in `apps/web`.
- Tailwind/shadcn stone-token design foundation.
- Storybook component catalog.
- Playwright smoke tests.

Real backend, Supabase auth, database migrations, AI, WhatsApp, finance, clinical notes, payroll, workers, n8n, FastAPI, Flask, VPS, and production services are still intentionally not implemented.

## How to Work Safely

1. Pick one small task.
2. Read the relevant docs before editing.
3. State what you are going to change.
4. Make the smallest useful change.
5. Run the relevant checks if the app scaffold exists.
6. Update documentation if behavior or setup changed.
7. Summarize the changed files in beginner-friendly language.

## What Not to Do

- Do not build the whole system in one run.
- Do not start with executive dashboards before the foundation is ready.
- Do not add Flask as the core backend.
- Do not add FastAPI in Phase 1.
- Do not add n8n as core workflow logic.
- Do not connect production Supabase, WhatsApp, AI, payment, or deployment services without approval.
- Do not put secrets in code or docs.
- Do not let AI mutate finance, appointments, payroll, clinical notes, refunds, or WhatsApp blasts.

## Current Commands

Use Corepack because this Windows environment may not expose a global `pnpm` shim:

```powershell
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

For the web app directly:

```powershell
corepack pnpm --dir apps/web dev
corepack pnpm --dir apps/web storybook
corepack pnpm --dir apps/web test:e2e
```

## Expected Checks

Normal development should include typecheck, lint, build, Storybook build for reusable UI, and Playwright smoke tests for important routes.

## Beginner-Friendly Change Summary

Every change summary should answer:

- What changed?
- Why did it change?
- Which files changed?
- How can someone check it?
- What is still missing or intentionally deferred?

## Documentation Rules

- Keep docs practical and direct.
- Prefer examples and checklists.
- Record open questions instead of guessing risky decisions.
- If an older document conflicts with `docs/24_TECH_STACK_LOCKFILE.md`, the lockfile wins.
- If the current user instruction conflicts with older docs, follow the current user instruction and record the conflict.

## Pull Request or Review Checklist

Before asking for review, confirm:

- The change is small and focused.
- No prohibited technologies were added.
- No production services were connected.
- No secrets were added.
- Sensitive workflows still require backend validation, permissions, and audit logs.
- New UI has loading, empty, error, and success-ready states where relevant.
- Docs were updated if setup, architecture, or behavior changed.
