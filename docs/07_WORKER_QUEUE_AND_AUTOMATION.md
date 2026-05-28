# 07 - Worker, Queue, and Automation Plan

## 1. Goal

Move slow or unreliable tasks out of the API request path.

The API should respond quickly. Workers handle background work.

## 2. Tasks That Must Run in Worker

- WhatsApp message processing
- AI draft generation
- Document extraction
- Spreadsheet parsing
- Embedding generation
- RAG evaluation
- Behavior extraction
- Weekly insight generation
- PDF report generation
- Reminder sending
- Campaign sending

## 3. Recommended MVP Queue

Use one of these:

```text
Option 1: Postgres event_outbox + pg-boss
Option 2: BullMQ + Render Key Value/Redis
```

For simplest start with Supabase/Postgres:

```text
event_outbox table
worker polls pending events
worker processes jobs
worker updates status
failed jobs retry
```

## 4. Event Types

```text
AppointmentCreated
AppointmentRescheduled
AppointmentCancelled
AppointmentCompleted
InboundWhatsAppMessageReceived
ConversationClosed
KnowledgeSourceUploaded
KnowledgeSourceApproved
KnowledgeSourcePublished
FinanceLedgerChanged
ReimbursementRequested
ClinicalNoteUnlockRequested
WhatsAppBlastApproved
```

## 5. Worker Rules

- Worker must never bypass domain rules.
- Worker must use the same use cases as the API.
- Worker must be idempotent.
- Worker must log failures.
- Worker must avoid infinite retries.
- Worker must attach correlation_id to every job.

## 6. Retry Policy

Suggested defaults:

```text
attempt 1: immediately
attempt 2: after 1 minute
attempt 3: after 5 minutes
attempt 4: after 30 minutes
attempt 5: mark failed and alert
```

## 7. Dead-Letter Queue

If job fails permanently:

- Mark as failed.
- Store error message.
- Store last payload.
- Alert admin/developer.
- Provide retry button in internal admin page.

## 8. Scheduled Jobs

Daily:

- Reminders for upcoming appointments.
- Clean old temp files.
- Recalculate active client metrics.

Weekly:

- Behavior insight summary.
- Top unanswered questions.
- AI cost summary.
- Practitioner utilization summary.

Monthly:

- Finance monthly summary snapshot.
- LTV leaderboard snapshot.
- Report export job.

## 9. Workflow Without n8n

Old approach:

```text
Webhook → n8n → AI logic → action
```

New approach:

```text
Webhook → Backend → Event Outbox → Worker → AI Gateway → Backend rule check → action/approval
```

## 10. Optional n8n Migration Bridge

If the old system still needs n8n temporarily:

- n8n can call restricted backend endpoints.
- n8n cannot write directly to database.
- Every n8n call needs API key, correlation_id, and scope.
- n8n output must be treated as suggestion, not truth.

## 11. Worker Dashboard

Create internal page:

```text
/jobs
```

Show:

- Pending jobs
- Running jobs
- Failed jobs
- Retry button
- Job payload summary
- Last error
- Duration
- Attempts

## 12. Performance Benchmarks

| Job Type | MVP Target |
|---|---|
| WhatsApp message saved | under 1 second |
| AI draft generated | under 8-15 seconds |
| Small PDF extraction | under 5 minutes |
| Embedding batch | async, no API blocking |
| Monthly report PDF | async if over 5 seconds |
| Queue delay normal | under 10 seconds |

## 13. Scaling Path

Phase 1:

```text
one worker handles all jobs
```

Phase 2:

```text
general worker + AI/document worker
```

Phase 3:

```text
API remains on Render
heavy document worker on VPS
```

Phase 4:

```text
separate queues per job type
add concurrency controls
```

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
