# 22 - Updated Robust Execution Order

## Purpose

This is the updated build order after locking the robust stack decision.

## Golden Rule

Do not start with Flask, microservices, or full multi-LLM automation.

Start with one stable TypeScript product foundation.

## Phase 0 - Repository and Guardrails

Goal: make the repo safe for Codex.

Tasks:

```text
1. Create Next.js app with TypeScript strict mode.
2. Add Tailwind, shadcn/ui, Radix UI, Motion.dev.
3. Add Storybook.
4. Add Biome or ESLint/Prettier.
5. Add Playwright.
6. Add folder structure for domain modules.
7. Add docs folder from this pack.
8. Add environment variable examples.
9. Add no-secret policy.
10. Add GitHub Actions basic checks.
```

Exit criteria:

```text
npm run typecheck passes
npm run lint passes
npm run test placeholder passes
Storybook opens locally
Playwright smoke test runs
```

## Phase 1 - Design System and App Shell

Goal: rebuild the HOM visual foundation in code.

Tasks:

```text
1. Implement color tokens from HOM mood: off-white, charcoal, warm gold, muted green, soft red.
2. Create AppShell with dark sidebar and top search bar.
3. Create reusable MetricCard, DataTable, StatusBadge, EmptyState, ErrorState, LoadingSkeleton.
4. Create Storybook stories for all core UI components.
5. Build static Strategic Overview page with mock data.
6. Add responsive layout rules.
7. Add reduced-motion support.
```

Exit criteria:

```text
No page-specific one-off styling for shared components.
Every component has a Storybook story.
Dashboard works with mock data.
```

## Phase 2 - Core Data and RBAC

Goal: establish the operational source of truth.

Tasks:

```text
1. Create Supabase schema migrations.
2. Add users, roles, permissions, user_roles.
3. Add clients, practitioners, services.
4. Add audit_logs.
5. Add RLS policies.
6. Add seed data for local/dev.
7. Add Zod schemas for inputs and outputs.
```

Exit criteria:

```text
A non-authorized user cannot access finance/clinical data.
All sensitive actions create audit logs.
RLS smoke tests pass.
```

## Phase 3 - Appointment Core

Goal: make operations reliable before dashboards get smarter.

Tasks:

```text
1. Create appointments table and status history.
2. Build appointment creation form.
3. Add practitioner availability validation.
4. Add reschedule flow.
5. Add cancel/no-show/done statuses.
6. Add calendar/list views.
7. Add WhatsApp conversation link placeholder.
```

Exit criteria:

```text
No double booking for same practitioner/time.
Every reschedule has history.
Every cancellation has reason.
Appointment UI has loading, empty, error, and success states.
```

## Phase 4 - Clinical Core

Goal: protect clinical context and notes.

Tasks:

```text
1. Create chronic case registry.
2. Create client condition flags.
3. Create session notes.
4. Create note lock/unlock workflow.
5. Add approval requests.
6. Add clinical audit logs.
```

Exit criteria:

```text
Locked notes cannot be edited directly.
Unlock requests require reason and approval.
Clinical data is not sent raw to AI by default.
```

## Phase 5 - Finance Core

Goal: fix financial consistency before AI CFO.

Tasks:

```text
1. Create financial_ledger.
2. Create monthly_summary.
3. Create expenses.
4. Create therapist_commissions.
5. Create reimbursements.
6. Add report export placeholder.
7. Ensure dashboard cards and ledger use same period filter.
```

Exit criteria:

```text
Financial summary and ledger reconcile.
No fake zero values when API fails.
Finance edits create audit logs.
```

## Phase 6 - Worker and Automation Foundation

Goal: add async jobs without n8n as core.

Tasks:

```text
1. Create event_outbox.
2. Create job_runs.
3. Create Render worker app.
4. Add retry/backoff.
5. Add dead-letter status.
6. Add internal job dashboard.
```

Exit criteria:

```text
Failed job can be retried.
Worker failure does not break core transaction.
Job logs are visible to admin/developer.
```

## Phase 7 - WhatsApp and Live Chat

Goal: build human-controlled AI communication.

Tasks:

```text
1. Create conversations and messages.
2. Add inbound webhook handler.
3. Add Live Chat page.
4. Add manual intervention toggle.
5. Add AI draft placeholder.
6. Add safe reply policy.
```

Exit criteria:

```text
Manual intervention disables auto-reply.
AI cannot reschedule without backend validation.
AI cannot diagnose or promise refunds.
```

## Phase 8 - Knowledge Studio

Goal: let owner manage AI knowledge safely.

Tasks:

```text
1. Add knowledge_sources.
2. Add file upload to Supabase Storage.
3. Add document processing job.
4. Add knowledge extraction review UI.
5. Add scope assignment.
6. Add publish and rollback.
7. Add test lab.
```

Exit criteria:

```text
Uploaded knowledge is not active until published.
Every published knowledge version can be rolled back.
AI answer can show which source was used.
```

## Phase 9 - AI Gateway

Goal: centralize all AI usage.

Tasks:

```text
1. Create ai-gateway package.
2. Add provider interface.
3. Add one model first.
4. Add structured output schemas.
5. Add prompt versioning.
6. Add Langfuse or logging adapter.
7. Add cost and latency logs.
```

Exit criteria:

```text
No direct model calls from UI components.
No direct model calls from random feature files.
Every AI call has prompt version, model, latency, cost estimate, and scope.
```

## Phase 10 - Optional Python Service Decision

Goal: add Python only if justified.

Decision checklist:

```text
Is document ingestion slow in TypeScript?
Do we need OCR/PDF parsing libraries better served by Python?
Do we need batch AI eval tools that are Python-first?
Can this be isolated from core transactions?
```

If yes, add FastAPI worker.
If no, keep TypeScript worker.
```
