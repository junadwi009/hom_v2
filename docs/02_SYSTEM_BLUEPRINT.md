# 02 - System Blueprint

## 1. High-Level Architecture

```text
Business Owner / Admin / Practitioner
        ↓
Web Dashboard - Next.js / React
        ↓
Backend API / BFF
        ↓
Application Use Cases
        ↓
Domain Modules
        ↓
Ports / Interfaces
        ↓
Adapters
        ↓
Supabase, Storage, WhatsApp, LLM providers, PDF generator, queue worker
```

## 2. Runtime Architecture

```text
Vercel Frontend
    ↓ HTTPS
Render Backend API
    ↓
Supabase Postgres + Storage + pgvector
    ↓
Event Outbox / Job Queue
    ↓
Render Worker
    ↓
External Services:
- WhatsApp provider
- LLM providers
- Langfuse
- Sentry
- PostHog
```

## 3. Core Modules

```text
auth/
roles/
clients/
practitioners/
services/
appointments/
clinical-cases/
session-notes/
finance/
commissions/
reimbursements/
whatsapp/
knowledge-studio/
behavior-intelligence/
ai-gateway/
approvals/
reports/
audit/
```

## 4. Module Responsibilities

### auth/

Handles login, session, identity, and user profile. It must not contain business logic.

### roles/

Handles roles and permissions. Every sensitive API endpoint must check permissions here.

### clients/

Stores client profiles, contact info, lifecycle status, and basic non-sensitive metadata.

### practitioners/

Stores practitioner account, display info, availability, attendance, and relation to appointments.

### appointments/

The operational core. Responsible for booking, reschedule, cancel, done, no-show, status history, and practitioner availability checks.

### clinical-cases/

Stores restricted clinical case summaries and assignment to practitioners.

### session-notes/

Stores session notes with lock/unlock workflow.

### finance/

Stores ledger entries, period summaries, gross/net calculations, expenses, and report data.

### commissions/

Calculates practitioner commission based on approved business rules.

### reimbursements/

Handles team reimbursement claims and approval flow.

### whatsapp/

Handles conversation inbox, messages, AI draft, human takeover, and blast approval.

### knowledge-studio/

Handles document upload, extraction, review, chunking, embedding, test lab, publish, and rollback.

### behavior-intelligence/

Extracts structured signals from chats: intent, objections, schedule preference, churn risk, unanswered questions, and segment ideas.

### ai-gateway/

Single gateway for all LLM calls. No feature should call OpenAI/Anthropic/Gemini directly.

### approvals/

Generic approval engine for reimbursement, note unlock, WhatsApp blast, and sensitive AI action requests.

### audit/

Records sensitive reads and writes.

## 5. Data Flow - Appointment Creation

```text
Admin creates appointment
  ↓
API validates payload with Zod
  ↓
Permission check: can_manage_appointments
  ↓
Appointment use case checks practitioner availability
  ↓
Database transaction creates appointment + status history
  ↓
Audit log created
  ↓
Event outbox creates AppointmentCreated event
  ↓
Worker sends reminder or confirmation message
```

## 6. Data Flow - WhatsApp AI Draft

```text
Incoming WhatsApp message
  ↓
Webhook acknowledges quickly
  ↓
Message saved
  ↓
Event outbox creates ConversationMessageReceived
  ↓
Worker calls AI Gateway
  ↓
AI Gateway retrieves allowed knowledge scope
  ↓
Policy guard checks risk
  ↓
Draft response saved
  ↓
If safe and auto-reply allowed: send
  ↓
If sensitive: request human intervention
```

## 7. Data Flow - Knowledge Upload

```text
Owner uploads file
  ↓
File stored in Supabase Storage
  ↓
knowledge_sources row created with status uploaded
  ↓
Worker extracts text/tables/images
  ↓
Owner reviews extraction
  ↓
Owner assigns scope
  ↓
Worker chunks and embeds approved content
  ↓
Owner runs test cases
  ↓
Owner publishes version
```

## 8. Data Flow - Behavior Learning

```text
Conversation closed or updated
  ↓
Worker extracts intent/topic/objection/sentiment
  ↓
Structured behavior events saved
  ↓
Weekly aggregation job creates insights
  ↓
Owner sees recommended FAQ/rule/campaign update
  ↓
Owner approves, edits, or rejects
  ↓
Approved update goes to Knowledge Studio draft
```

## 9. Data Flow - Finance Report

```text
Finance admin enters ledger data
  ↓
Finance use case validates category and period
  ↓
Ledger entry saved
  ↓
Monthly summary recalculated
  ↓
Report snapshot created
  ↓
Owner can export PDF
```

## 10. Service Boundaries

### Core transaction boundaries

The following must be backend-controlled only:

- Appointments
- Finance
- Commissions
- Reimbursements
- Clinical cases
- Session notes
- Payment/package state if added later
- User permissions

### AI boundaries

AI may draft, classify, summarize, and suggest. Backend decides whether actions are allowed.

### Worker boundaries

Worker may process async jobs. Worker must call domain/use-case functions, not bypass rules.

## 11. Integration Boundaries

| Integration | Role | Rule |
|---|---|---|
| WhatsApp provider | Communication channel | Never source of truth |
| LLM providers | Drafting/classification/analysis | No direct mutation |
| Supabase | Database/auth/storage/vector | Source of truth |
| Langfuse | AI observability | No business data beyond logged traces where allowed |
| PostHog | Product analytics | Avoid clinical/PII event payloads |
| Sentry | Error tracking | Scrub PII |

## 12. Scalability Model

Start simple:

```text
1 backend instance
1 worker instance
1 database
1 queue/cache
```

Scale by:

```text
1. Optimize database queries.
2. Add caching for dashboard cards.
3. Add worker concurrency.
4. Split heavy document worker from general worker.
5. Upgrade Supabase compute.
6. Add VPS only for heavy AI/document ingestion if needed.
```
