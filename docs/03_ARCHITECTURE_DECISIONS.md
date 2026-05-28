# 03 - Architecture Decisions

## ADR 001 - Use Modular Monolith, Not Microservices

### Decision

Use a modular monolith.

### Reason

A solo developer needs low operational complexity. Microservices add deployment complexity, network failures, distributed transactions, observability burden, and debugging difficulty.

### Consequence

All modules live in one repo and can be deployed together. Internal boundaries must be enforced through folder structure, interfaces, and tests.

## ADR 002 - Use Selective Hexagonal Architecture

### Decision

Use hexagonal architecture only for high-risk modules:

- Appointments
- Finance
- Clinical notes
- WhatsApp
- AI Gateway
- Knowledge Studio
- Approvals

Use normal layered CRUD for simple settings and static catalogs.

### Reason

Full clean architecture everywhere is too heavy. But direct coupling to external tools is dangerous in finance, AI, and communication.

### Consequence

Each high-risk module must separate:

```text
Domain logic
Application use case
Ports/interfaces
Adapters/infrastructure
```

## ADR 003 - Remove n8n from Critical Path

### Decision

Do not use n8n as the main intelligence layer in v2. Use code-first workers and an AI Gateway.

### Reason

n8n is flexible but difficult to test and version as core business logic. Core logic must live in the repo.

### Consequence

n8n may remain temporarily for migration or non-critical workflows, but the target system should not depend on n8n for appointment, finance, payroll, clinical notes, or AI safety.

## ADR 004 - Use Event Outbox and Worker

### Decision

Use an event outbox table and a worker queue. Start with pg-boss or a Postgres-backed queue. Add Redis/BullMQ only when needed.

### Reason

Document ingestion, WhatsApp messages, AI calls, and report generation should not block API requests.

### Consequence

All slow tasks become jobs with retry, status, and failure logs.

## ADR 005 - Use Multi-LLM Through a Gateway Only

### Decision

All LLM calls must go through `ai-gateway`.

### Reason

Without a gateway, costs, prompts, model choice, logs, and safety rules will spread everywhere.

### Consequence

Features call business functions like:

```text
classifyIntent()
draftReply()
summarizeConversation()
extractBehaviorSignals()
analyzeFinance()
parseDocument()
```

They do not call provider APIs directly.

## ADR 006 - AI Must Be Human-in-the-Loop for Sensitive Actions

### Decision

AI cannot autonomously approve or modify:

- Finance
- Payroll/commission
- Reimbursement
- Clinical note unlock
- Refunds
- Diagnosis
- WhatsApp blast to many customers

### Reason

The system touches sensitive operational, financial, and clinical-adjacent data.

### Consequence

Sensitive AI suggestions become `approval_requests`.

## ADR 007 - Use Knowledge Studio Instead of Hardcoded Prompts

### Decision

Create a dashboard where owner can upload documents, review extracted knowledge, test AI responses, publish, and rollback.

### Reason

The business owner needs to update pricing, SOP, FAQ, campaign tone, and service knowledge without developer involvement.

### Consequence

Knowledge has versions, scopes, review status, and test runs.

## ADR 008 - Deployment Stack

### Decision

Phase 1 production:

```text
Vercel frontend
Render backend
Render worker
Render Key Value or Postgres queue
Supabase database/storage/vector
```

### Reason

This balances cost, performance, Singapore-region availability, and low DevOps burden.

### Consequence

Avoid Heroku for primary deployment because Common Runtime region is US/EU only. Avoid full VPS until heavy workers justify it.

## ADR 009 - Frontend Quality Stack

### Decision

Use:

```text
Next.js
React 19
TypeScript
Tailwind
shadcn/ui
Radix UI
Motion.dev
21st.dev Agent Elements or compatible AI UI components
Storybook
Playwright
```

UIPro can be used only after Figma is clean.

### Reason

The platform needs a premium, stable, dashboard-heavy frontend.

### Consequence

Generated UI must be refactored into reusable components and pass quality checks.

## ADR 010 - Source of Truth

### Decision

Supabase/Postgres is the source of truth.

### Reason

WhatsApp, AI, workers, files, and dashboards are secondary. The database must be consistent.

### Consequence

No external tool can directly decide core state without backend validation.

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
