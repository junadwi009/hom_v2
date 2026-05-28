# 00 - Master Context for Codex

## Project

HOM Studio OS v2

## Mission

Rebuild the existing HOM-style clinical pilates/physio studio platform into a clean, documented, production-ready internal operating system.

## Current System Summary

Based on the provided super admin screenshots, the existing system appears to include:

- Executive strategic dashboard
- Financial dashboard and ledger
- AI Business Agent connected to internal data
- WhatsApp live chat with AI/human handoff
- Appointment page
- Client LTV and milestone dashboard
- Chronic case registry
- Team attendance
- Practitioner account management
- Approvals and payroll workspace

## Target System

The target system should be easier to maintain, safer, and better documented. It must support:

- Booking and appointment operations
- Clinical case management
- Finance and reporting
- Practitioner performance
- Customer LTV and retention
- WhatsApp communication
- Knowledge Studio for uploaded files
- Multi-LLM AI assistant with strict governance
- Behavior intelligence from chat data

## Non-negotiable Rules for Codex

1. Use small, reviewable commits.
2. Do not run destructive commands.
3. Do not delete existing data or migrations unless explicitly instructed.
4. Do not add paid APIs unless placed behind environment variables.
5. Do not build microservices.
6. Do not make AI autonomous for finance, payroll, clinical notes, refunds, or diagnosis.
7. Do not let n8n or any worker write directly to core tables without backend validation.
8. Add tests for every important business rule.
9. Every sensitive action must create an audit log.
10. Every feature must have loading, empty, and error states.

## Technical Stack

Recommended stack:

```text
Frontend: Next.js, React 19, TypeScript, Tailwind, shadcn/ui, Radix UI, Motion.dev
AI UI: 21st.dev Agent Elements or equivalent shadcn-compatible components
Design-to-code accelerator: UIPro by Locofy, only after Figma is clean
Backend: Next.js route handlers or separate Node/Fastify service on Render
Database: Supabase Postgres
Storage: Supabase Storage
Vector search: Supabase pgvector
Worker: Render background worker with pg-boss or BullMQ
LLM observability: Langfuse
Error tracking: Sentry
Product analytics: PostHog
Testing: Vitest, Playwright, k6, Lighthouse CI
```

## Deployment Target

Phase 1 production:

```text
Vercel: frontend
Render: backend API
Render: worker
Render Key Value or Postgres queue: queue/cache
Supabase Singapore: database, auth, storage, pgvector
```

## Coding Style

- TypeScript strict mode.
- Zod for runtime validation.
- No untyped API input.
- No direct database access from UI components.
- Domain logic lives in `packages/domain` or server-side modules.
- External services must use adapters.
- Business use cases must be testable without calling external APIs.

## Build Strategy

Build in this order:

1. Repo foundation and documentation.
2. Auth and RBAC.
3. Database schema and migrations.
4. Clients, practitioners, services.
5. Appointments.
6. Clinical cases and session notes.
7. Finance.
8. Worker queue.
9. WhatsApp inbox.
10. Knowledge Studio.
11. AI Gateway.
12. Behavior Intelligence.
13. Executive dashboard.

## Definition of Done

A feature is done only if:

- It has database migration if needed.
- It has API validation.
- It has permission checks.
- It has audit logs if sensitive.
- It has tests.
- It has loading/empty/error UI states.
- It has documentation.
- It has no hardcoded secrets.

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
