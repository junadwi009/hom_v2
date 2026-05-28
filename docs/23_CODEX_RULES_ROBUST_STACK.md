# 23 - Codex Rules for Robust Stack

## Purpose

This document gives Codex strict instructions so it does not accidentally create the wrong architecture.

## Hard Rules

```text
Do not introduce Flask as the main backend.
Do not introduce FastAPI until explicitly requested in a later phase.
Do not call OpenAI/Anthropic/Gemini directly from UI components.
Do not let workers mutate sensitive domain data without backend validation.
Do not build dashboards before source-of-truth tables exist.
Do not create one-off UI components when a reusable component should exist.
Do not add paid APIs unless behind environment variables.
Do not put secrets in code or docs.
Do not implement n8n as core transaction logic.
```

## Preferred Implementation Pattern

Use this pattern for every feature:

```text
1. Define domain model.
2. Define database migration.
3. Define Zod schema.
4. Define service/use-case function.
5. Define route/server action.
6. Define UI component.
7. Add loading/empty/error/success states.
8. Add tests.
9. Add Storybook story if UI component.
10. Add audit log if sensitive.
```

## Folder Rules

```text
apps/web/app              = routes/pages/layouts
apps/web/features         = feature-specific UI and hooks
apps/web/components/ui    = generic reusable UI
apps/web/components/hom   = HOM-specific reusable UI
apps/web/components/agent = AI/chat components
apps/worker               = TypeScript background jobs
packages/domain           = business logic
packages/db               = migrations, schema helpers, queries
packages/ai-gateway       = all model calls
packages/shared           = shared types and utilities
```

## AI Rules

```text
All AI calls must go through packages/ai-gateway.
Every AI call must log model, prompt version, feature, latency, token estimate, and result status.
AI must return structured output for classification/action proposals.
AI may draft responses.
AI may suggest actions.
AI may not directly execute sensitive actions.
Sensitive actions require backend validation and often human approval.
```

## UI Rules

```text
Every screen must have loading, empty, error, and success states.
Every table must have filters/search if data can grow.
Every dashboard metric must show period/source.
Never show fake zero values for failed API calls.
Use subtle Motion.dev animation only after layout is stable.
Keep HOM visual identity: calm, premium, clinical, warm neutral.
```

## Python Rules

```text
No Python in Phase 1.
If Python is added later, use FastAPI or a queue worker.
Python service must not own core data.
Python must not bypass RBAC/RLS for sensitive actions.
Python writes processing results, not final domain decisions.
```

## Deployment Rules

```text
Frontend deploys to Vercel.
Backend/API and worker deploy to Render.
Supabase remains database/auth/storage/vector.
Redis/Render Key Value is optional until queue/cache needs justify it.
VPS is optional only for heavy document/AI worker later.
```
