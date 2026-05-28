# 13 - Codex Task Prompts

Use these prompts one at a time. Do not paste all prompts at once.

## Prompt 01 - Repo Foundation

```text
You are working on HOM Studio OS v2.
Read docs/00_MASTER_CONTEXT_FOR_CODEX.md first.
Create the initial monorepo structure exactly as described in docs/README.md.
Do not implement business features yet.
Add TypeScript strict mode, lint/format scripts, test placeholder, env.example, and a basic README.
Do not add paid APIs except environment variable placeholders.
After changes, summarize files created and commands to run.
```

## Prompt 02 - RBAC Schema

```text
Implement the RBAC foundation from docs/04_DATABASE_SCHEMA.md.
Create migrations for users, roles, permissions, user_roles, and role_permissions.
Add seed data for roles and permissions from docs/10_SECURITY_AND_GOVERNANCE.md.
Create helper functions getCurrentUser and requirePermission.
Add tests for allowed and forbidden access.
Do not build UI yet.
```

## Prompt 03 - Dashboard Shell

```text
Create the base dashboard shell using Next.js, TypeScript, Tailwind, shadcn/ui, and Motion.dev.
Implement sidebar, topbar, page container, loading state, empty state, error state, and permission denied state.
Use subtle motion only and support reduced motion.
Do not connect to real data yet.
```

## Prompt 04 - Clients, Practitioners, Services

```text
Implement clients, practitioners, and services modules.
Use docs/04_DATABASE_SCHEMA.md and docs/05_API_CONTRACTS.md.
Add migrations, API routes, Zod validation, list/detail/create/update operations, permission checks, and audit logs for sensitive edits.
Create simple UI tables and forms with loading, empty, and error states.
Add unit/integration tests.
```

## Prompt 05 - Appointment Core

```text
Implement appointment core.
Use docs/01_PRD.md, docs/02_SYSTEM_BLUEPRINT.md, and docs/05_API_CONTRACTS.md.
Create appointment tables, status history, create appointment use case, reschedule use case, cancel use case, overlap validation, permission checks, audit logs, and tests.
Create basic calendar/table UI.
Do not integrate WhatsApp yet.
```

## Prompt 06 - Clinical Cases and Session Notes

```text
Implement clinical case registry and session notes.
Create chronic_cases, session_notes, and clinical_note_unlock_requests.
Implement view restrictions, audit logs for clinical access, note finalize/lock, unlock request, approve/reject unlock, and tests.
AI must not be connected to raw clinical notes yet.
```

## Prompt 07 - Finance Core

```text
Implement finance core.
Create financial_ledger, monthly_summary, therapist_commissions, and reimbursements.
Implement ledger entry creation, monthly summary recalculation, reimbursement request, approval stub, and finance dashboard UI.
Add tests that prove ledger totals and summary totals match.
Avoid fake zero when data fails to load.
```

## Prompt 08 - Event Outbox and Worker

```text
Implement event_outbox and worker app.
Use docs/07_WORKER_QUEUE_AND_AUTOMATION.md.
Create worker dispatcher, retry policy, failed job logging, and basic job dashboard.
Make AppointmentCreated event produce a placeholder job result.
Do not add WhatsApp provider yet.
```

## Prompt 09 - WhatsApp Inbox

```text
Implement WhatsApp conversation inbox without real provider send first.
Create whatsapp_conversations and whatsapp_messages tables.
Create inbound webhook endpoint with validation placeholder.
Save inbound messages and show them in live chat UI.
Add manual intervention toggle.
Add audit logs for manual outbound messages.
```

## Prompt 10 - AI Gateway

```text
Implement AI Gateway skeleton.
Create provider interface, model alias config, mock provider for tests, Langfuse logging placeholder, classifyIntent, draftReply, and policyGuard.
No feature may call LLM provider directly.
Use structured JSON outputs.
Add tests that policyGuard blocks diagnosis, refund promise, and direct reschedule confirmation.
```

## Prompt 11 - Knowledge Studio Upload and Review

```text
Implement Knowledge Studio MVP phase 1.
Create knowledge_sources and knowledge_extractions tables.
Create file upload metadata flow, review screen, extraction job placeholder, scope assignment, and publish state model.
Uploaded knowledge must not be active until published.
Do not implement embeddings yet.
```

## Prompt 12 - Knowledge Retrieval and Test Lab

```text
Add knowledge chunking, embeddings placeholder/interface, retrieval function, and Knowledge Studio Test Lab.
Answers must show retrieved sources.
Add publish/rollback behavior.
Use pgvector if available; otherwise add an adapter interface and mock retrieval in tests.
```

## Prompt 13 - Behavior Intelligence

```text
Implement behavior intelligence from WhatsApp conversations.
Create conversation_events and customer_behavior_profiles.
Add worker job to extract intent/topic/objection/preference from conversations using AI Gateway.
Store structured events.
Create dashboard for top intents, unanswered questions, and suggested knowledge updates.
Suggestions must require owner approval.
```

## Prompt 14 - Executive Dashboard

```text
Implement Strategic Overview dashboard using real data queries from appointments, clients, finance, LTV, practitioner metrics, and AI logs.
Ensure financial numbers match the finance module.
Add loading, empty, and error states.
Add tests for dashboard query functions.
```

## Prompt 15 - Production Deployment Prep

```text
Prepare deployment files and runbook.
Add healthcheck endpoint.
Add Render service notes for backend and worker.
Add Vercel notes for frontend.
Add Supabase env documentation.
Add Sentry, Langfuse, and PostHog placeholders.
Add production checklist.
Do not deploy automatically.
```

## Prompt 16 - Quality Audit

```text
Audit the current codebase against docs/11_TESTING_AND_QUALITY_GATES.md.
Find missing tests, missing permission checks, missing loading/empty/error states, missing audit logs, and direct external provider calls.
Do not fix everything at once. Produce a prioritized remediation plan first.
```

---

# Additional Code-First UI Prompts

For frontend execution without Figma, use `19_CODE_FIRST_UI_CODEX_PROMPTS.md`. Run one UI prompt at a time. Start with UI-01 only.

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
