# 12 - Step-by-Step Execution Plan

## How to Use This Plan

Do not ask Codex to build everything at once. Use one task at a time. After each task, review diff, run tests, and commit.

## Sprint 0 - Project Setup and Documentation

### Goal

Create a clean repo foundation.

### Tasks

1. Create monorepo structure.
2. Add TypeScript strict mode.
3. Add lint/format tooling.
4. Add env template.
5. Add docs folder.
6. Add CI pipeline skeleton.
7. Add README.

### Acceptance Criteria

- Repo installs successfully.
- Typecheck command exists.
- Lint command exists.
- Test command exists.
- Build command exists.
- Docs folder exists.

## Sprint 1 - Auth and RBAC

### Goal

Create users, roles, permissions, and route guards.

### Tasks

1. Create user tables.
2. Create role and permission tables.
3. Seed basic roles.
4. Create `getCurrentUser()`.
5. Create `requirePermission()`.
6. Protect admin routes.
7. Add tests.

### Acceptance Criteria

- User without permission cannot access protected API.
- Studio Director can access all admin features.
- Practitioner cannot access finance.
- Permission failure returns clear error.

## Sprint 2 - Base UI Shell

### Goal

Create dashboard layout.

### Tasks

1. Add shadcn/ui.
2. Add Tailwind tokens.
3. Add sidebar.
4. Add topbar.
5. Add page container.
6. Add empty/loading/error components.
7. Add Motion.dev presets.
8. Add Storybook if desired.

### Acceptance Criteria

- Dashboard shell looks consistent.
- Reduced motion is respected.
- Components are reusable.

## Sprint 3 - Clients, Practitioners, Services

### Goal

Create base operational data.

### Tasks

1. Create clients table and APIs.
2. Create practitioners table and APIs.
3. Create services table and APIs.
4. Create UI tables and forms.
5. Add filters/search.
6. Add audit logs for sensitive edits.

### Acceptance Criteria

- Admin can create client.
- Admin can create practitioner.
- Admin can create service.
- UI has loading/empty/error states.

## Sprint 4 - Appointments Core

### Goal

Create reliable appointment management.

### Tasks

1. Create appointment tables.
2. Implement create appointment use case.
3. Implement overlap check.
4. Implement reschedule.
5. Implement cancel.
6. Implement status history.
7. Create calendar/table UI.
8. Add tests.

### Acceptance Criteria

- Overlapping practitioner appointment is rejected.
- Reschedule creates history.
- Cancel creates reason.
- Appointment actions create audit logs.

## Sprint 5 - Clinical Cases and Session Notes

### Goal

Create controlled clinical workflow.

### Tasks

1. Create chronic case tables.
2. Create session note tables.
3. Implement note draft/edit/finalize.
4. Implement note lock.
5. Implement unlock request.
6. Implement approval.
7. Add permission checks.
8. Add tests.

### Acceptance Criteria

- Locked note cannot be edited.
- Unlock request requires approval.
- Clinical case access is audited.

## Sprint 6 - Finance Foundation

### Goal

Create trustworthy finance module.

### Tasks

1. Create ledger table.
2. Create monthly summary table.
3. Implement add ledger entry.
4. Implement summary recalculation.
5. Implement commission calculation placeholder.
6. Create finance dashboard.
7. Create PDF export placeholder.
8. Add tests.

### Acceptance Criteria

- Ledger and summary match.
- Finance dashboard does not show fake zero on failed load.
- Finance edits create audit logs.

## Sprint 7 - Worker and Event Outbox

### Goal

Move slow jobs out of API.

### Tasks

1. Create event_outbox table.
2. Create worker app.
3. Implement event dispatcher.
4. Implement retry policy.
5. Implement failed job handling.
6. Add job dashboard.

### Acceptance Criteria

- AppointmentCreated event is processed by worker.
- Failed job retries.
- Failed job appears in job dashboard.

## Sprint 8 - WhatsApp Inbox

### Goal

Create communication layer.

### Tasks

1. Create conversation tables.
2. Create message tables.
3. Create inbound webhook endpoint.
4. Create conversation inbox UI.
5. Create manual intervention toggle.
6. Create outbound message function.
7. Add audit logs.

### Acceptance Criteria

- Webhook saves inbound message.
- Admin can view conversation.
- Manual intervention disables auto-reply.

## Sprint 9 - AI Gateway

### Goal

Centralize LLM calls.

### Tasks

1. Create AI provider interface.
2. Create model alias config.
3. Implement Langfuse logging.
4. Implement policy guard.
5. Implement `classifyIntent()`.
6. Implement `draftReply()`.
7. Add tests using mocked provider.

### Acceptance Criteria

- No feature calls LLM provider directly.
- AI logs include model alias, latency, tokens/cost if available.
- Policy guard blocks unsafe outputs.

## Sprint 10 - Knowledge Studio MVP

### Goal

Upload and test knowledge.

### Tasks

1. Create knowledge tables.
2. Create file upload flow.
3. Create extraction worker.
4. Create review UI.
5. Create chunking.
6. Create embeddings.
7. Create retrieval function.
8. Create test lab.
9. Create publish/rollback.

### Acceptance Criteria

- Uploaded file is not active until published.
- Test lab returns answer with sources.
- Owner can rollback.

## Sprint 11 - Behavior Intelligence

### Goal

Extract customer behavior from chat.

### Tasks

1. Create behavior tables.
2. Implement chat extraction job.
3. Implement weekly insight job.
4. Create behavior dashboard.
5. Create suggested knowledge update flow.

### Acceptance Criteria

- Raw chat is summarized into structured events.
- Owner must approve suggestions before publishing.

## Sprint 12 - Executive Dashboard

### Goal

Create the strategic overview.

### Tasks

1. Revenue KPI.
2. Active clients KPI.
3. Practitioner utilization.
4. LTV leaderboard.
5. AI cost card.
6. Appointment trend.
7. Finance summary.

### Acceptance Criteria

- Dashboard data comes from real queries.
- Loading/empty/error states exist.
- Financial totals match finance module.

## Sprint 13 - Production Readiness

### Goal

Prepare deploy.

### Tasks

1. Configure Vercel.
2. Configure Render backend.
3. Configure Render worker.
4. Configure Supabase production.
5. Configure Sentry.
6. Configure Langfuse.
7. Configure PostHog.
8. Create backup/restore runbook.
9. Run full QA checklist.

### Acceptance Criteria

- Production env vars are set.
- No secrets in repo.
- Healthcheck endpoint works.
- Worker processes jobs.
- Error tracking receives test error.
- AI trace appears in Langfuse.

---

# Revision - Frontend Execution Order Without Figma

After foundation setup, implement the frontend in this order: design tokens -> app shell -> reusable components -> mock pages -> Storybook/demo states -> Playwright smoke tests -> API integration -> real data. Do not connect live APIs before loading/empty/error/success states exist.

---

## Robust Stack Update - 2026-05-25

The latest stack decision is now defined in:

```text
docs/20_ROBUST_STACK_DECISION.md
docs/21_OPTIONAL_PYTHON_SERVICE_STRATEGY.md
docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md
docs/23_CODEX_RULES_ROBUST_STACK.md
docs/24_TECH_STACK_LOCKFILE.md
```

If this document conflicts with the robust stack docs, the robust stack docs win.

Main decision:

```text
Use Next.js + React + TypeScript as the core product stack.
Do not use Flask as the main backend.
Use FastAPI only later as an optional AI/document worker if justified.
Keep Supabase/Postgres as the source of truth.
Keep workers asynchronous and code-first.
```
