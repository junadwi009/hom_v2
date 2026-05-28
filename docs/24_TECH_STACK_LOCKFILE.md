# 24 - Technology Stack Lockfile

This document is the plain-English stack lockfile. If there is a conflict between older docs and this document, this document wins.

## Main Stack

```text
Frontend: Next.js + React + TypeScript
UI: Tailwind + shadcn/ui + Radix UI
Motion: Motion.dev
Component docs: Storybook
E2E tests: Playwright
Database: Supabase Postgres
Auth: Supabase Auth initially, with RBAC in app tables
Storage: Supabase Storage
Vector search: Supabase pgvector
Backend runtime: Next.js route handlers/server actions and/or Render API service
Worker: Render TypeScript worker
Queue: event_outbox first; pg-boss or Redis later
AI: centralized AI Gateway
Deployment: Vercel + Render + Supabase
```

## Not Main Stack

```text
Flask is not the main backend.
FastAPI is not Phase 1.
n8n is not core transaction logic.
Microservices are not Phase 1.
Kubernetes is not Phase 1.
VPS is not Phase 1 except optional experimentation.
```

## Future Allowed Additions

```text
FastAPI Python AI/document worker
Dedicated VPS heavy worker
Redis/Render Key Value
Langfuse
OpenTelemetry
PostHog
Sentry
```

## Why This Lockfile Exists

Codex and AI coding agents can easily over-expand a project. This file keeps implementation focused and prevents architecture drift.

Every time Codex proposes a new tool, ask:

```text
Does it reduce complexity now?
Does it replace an existing tool?
Does it improve safety, performance, or maintainability?
Can a beginner maintain it?
Can it be removed later?
```

If the answer is unclear, do not add it.
