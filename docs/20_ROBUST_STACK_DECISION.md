# 20 - Robust Stack Decision

## Purpose

This document locks the recommended stack for HOM Studio OS v2 after comparing the existing proposed build with Flask + React.

## Final Verdict

Use this as the main strategy:

```text
Core product:
Next.js + React + TypeScript
Supabase/Postgres
Render backend/API + Render worker
AI Gateway
Code-first design system
Storybook
Playwright
```

Do not rebuild the main system as:

```text
Flask backend + React SPA frontend
```

Python is still useful, but only as a specialized worker/service for heavy document or AI processing later.

## Why This Is the Most Robust Choice

HOM Studio OS v2 is not a simple CRUD app. It contains:

```text
appointment operations
clinical case registry
session notes and note unlock approvals
financial ledger
practitioner commission
reimbursements
WhatsApp live chat
AI Business Agent
Knowledge Studio
behavior intelligence
file ingestion
background workers
approval workflow
```

A two-stack Flask + React architecture creates more boundaries for a solo developer: separate API contracts, CORS, auth handling, schema validation, OpenAPI discipline, deployment separation, and duplicate type definitions. That is manageable for a team, but it adds avoidable complexity for a solo developer using Codex.

The robust strategy is to keep the product and dashboard in a single TypeScript-first ecosystem, while allowing a Python worker only where Python clearly wins.

## Stack Lock

```text
Frontend and BFF:
Next.js App Router
React
TypeScript strict mode
Tailwind
shadcn/ui
Radix UI
Motion.dev
Storybook

Database and platform data:
Supabase Postgres
Supabase Auth
Supabase Storage
Supabase pgvector
Supabase RLS

Backend/API:
Next.js route handlers and server actions for app-facing mutations
A dedicated Render service if API/workers need separation
Zod validation at every boundary

Background jobs:
Render worker
Postgres event_outbox first
pg-boss or Redis-backed queue when needed

AI:
AI Gateway package
structured outputs
function/tool calling
RAG over approved knowledge
multi-LLM routing later, not first

Optional Python:
FastAPI worker/service for document parsing, OCR, embeddings, and AI evals
Not Flask as the main app backend
```

## No-Flask-As-Core Rule

Flask is not banned. It is simply not the best fit as the core backend for this product.

Use Flask only if:

```text
it is a tiny internal utility
it has no high-concurrency external API calls
it has no core transaction ownership
it can be replaced without touching product logic
```

For production Python APIs, prefer FastAPI.

## FastAPI Optional Service Rule

Add FastAPI only when one of these becomes real:

```text
Docling/Unstructured pipeline becomes heavy
OCR/image parsing needs Python tools
spreadsheet intelligence becomes complex
embedding batch jobs slow down TypeScript workers
RAG evaluation needs Python libraries
ML/data science experiments need Python ecosystem
```

Do not add FastAPI in Phase 1 just because it sounds more powerful.

## Source of Truth Rule

Supabase/Postgres remains the source of truth.

No worker, AI model, FastAPI service, or frontend component may become the source of truth for:

```text
appointments
clinical notes
finance
payroll
approvals
client profile
knowledge versions
AI logs
```

## Deployment Rule

Primary production path:

```text
Vercel: frontend/admin dashboard
Render: backend/API and worker
Render Key Value/Redis: cache/queue if needed
Supabase: database, auth, storage, vector
Optional VPS later: heavy AI/document worker only
```

## Architecture Name

The official architecture name for the project is:

```text
AI-native Modular Monolith
+ Selective Hexagonal Architecture
+ Code-first UI Design System
+ Event-driven Worker Layer
+ Optional Python AI/Document Worker
```
