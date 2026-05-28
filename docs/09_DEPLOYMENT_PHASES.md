# 09 - Deployment Phases and Capacity Plan

## 1. Final Recommendation

Use this for MVP production:

```text
Vercel: frontend
Render: backend API
Render: background worker
Render Key Value or Postgres queue: queue/cache
Supabase: database, auth, storage, pgvector
Primary region: Singapore where possible
```

Avoid Heroku as primary backend if most users are in Indonesia/Singapore because Heroku Common Runtime is US/EU only. Avoid full VPS at the beginning unless heavy workers justify it.

## 2. Phase 0 - Development Prototype

### Use When

- Developer only.
- Dummy data.
- No real finance/clinical data.
- Less than 100 clients.

### Stack

```text
Vercel Hobby
Supabase Free
Render Starter backend or local backend
No paid Redis unless needed
```

### Benchmarks

```text
Dashboard load: under 4 seconds
API CRUD p95: under 800 ms
AI response: async, under 20 seconds acceptable
```

### Cost Range

```text
Approx. $0-$25/month
```

## 3. Phase 1 - MVP Production Internal

### Use When

- 1 studio.
- 3-10 staff/practitioners.
- 300-1,000 clients.
- 500-2,000 appointments/month.
- 1,000-5,000 WhatsApp messages/month.
- 10-100 document uploads/month.

### Stack

```text
Vercel Pro
Supabase Pro - Singapore
Render backend Starter/Standard - Singapore
Render worker Starter
Render Key Value Starter or Postgres queue
```

### Benchmarks

```text
Dashboard initial load: under 3 seconds
Appointment create/update p95: under 700 ms
Chat backend p95: under 1 second, excluding provider delay
AI draft: under 8-15 seconds
Small document ingestion: async, under 5 minutes
Queue delay: under 10 seconds normal
```

### Cost Range

```text
Approx. $69-$120/month before LLM usage
```

## 4. Phase 2 - Stable Production

### Upgrade Triggers

- Backend CPU often over 70%.
- Worker queue delay over 60 seconds.
- Appointment API p95 over 1 second.
- Dashboard frequently slow.
- PDF/XLSX ingestion blocks other jobs.
- Supabase database nearing plan limits.

### Stack

```text
Vercel Pro
Supabase Pro with compute upgrade if needed
Render backend Standard
Render worker Standard
Render Key Value Standard
Optional second worker for AI/document jobs
```

### Benchmarks

```text
API p95: under 500-800 ms
Dashboard cached cards: under 1.5 seconds
Queue delay: under 30 seconds
AI fallback if timeout
Error rate: under 1%
```

### Cost Range

```text
Approx. $120-$250/month before LLM usage
```

## 5. Phase 3 - Heavy AI and Document Processing

### Upgrade Triggers

- Hundreds of PDF/XLSX/image files per month.
- OCR or vision parsing becomes slow.
- Embedding batch jobs create long queue backlog.
- Render worker becomes expensive.

### Stack

```text
Vercel frontend
Render API
Supabase database/storage/vector
VPS heavy worker only
Queue shared through Postgres/Redis
```

### Benchmarks

```text
API unaffected during ingestion batch
Normal backlog clears under 15 minutes
Heavy worker restarts automatically
Failed jobs enter retry/dead-letter queue
```

### Cost Range

```text
Approx. $150-$350/month before LLM usage
```

## 6. Phase 4 - Multi-Studio / SaaS Serious

### Upgrade Triggers

- More than 5 studios.
- More than 10,000 clients.
- More than 20,000 appointments/month.
- More than 50,000 WhatsApp messages/month.
- Multi-tenant billing needed.
- SLA becomes important.

### Stack Options

```text
Render Pro/Scale
or VPS cluster
or Fly.io/Railway/DO App Platform
or Kubernetes only if team/scale justifies it
```

### Benchmarks

```text
API p95: under 500 ms for core operations
Queue delay: under 10-30 seconds
DB query p95: under 100-200 ms for core tables
Error rate: under 0.5%
Backup restore tested monthly
```

### Cost Range

```text
Approx. $350-$1,000+/month before LLM usage
```

## 7. Things People Forget

### 7.1 AI Cost Can Exceed Hosting

Track:

- Cost per feature.
- Cost per conversation.
- Cost per document ingestion.
- Cost per model.
- Failed AI calls.

### 7.2 Region Alignment Matters

Try to keep backend, Redis/queue, and Supabase in Singapore region.

Bad:

```text
Backend US/EU + Database Singapore
```

Better:

```text
Backend Singapore + Database Singapore
```

### 7.3 File Storage and Egress

Knowledge Studio stores documents and extracted data. Add file size limits and retention policy.

### 7.4 Observability From Day One

Use at least:

```text
Sentry
Langfuse
PostHog
basic uptime monitor
```

### 7.5 Backups and Restore

A backup that has never been restored is only hope, not a recovery plan.

## 8. Final Hosting Decision

Best initial path:

```text
Vercel + Render + Supabase
```

Not recommended as primary:

```text
Single Heroku app + Supabase
```

Use VPS later for:

```text
heavy document parsing
OCR
batch embedding
AI evaluation
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
