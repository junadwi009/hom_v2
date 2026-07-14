# Phase RAG-1: Knowledge Ingestion (Knowledge Studio MVP) — Log

- **Spec:** `docs/superpowers/specs/2026-07-13-rag-knowledge-ingestion-design.md` (Status: Implemented)
- **Design source of truth:** `docs/06_AI_KNOWLEDGE_STUDIO.md`
- **Scope:** Sub-project 1 only — upload → extract → review → publish → ask (Test Lab). Does **not** wire retrieval into Live Chat or the AI Business Agent (see "Out of scope" below).

This log is written for a beginner solo dev: what got built, in plain language, and how to run it locally.

## What was built

### 1. Database (Supabase / Postgres + pgvector)
- `supabase/migrations/20260713000100_knowledge_ingestion_tables.sql`
  - `knowledge_sources` — one row per uploaded file (status: `uploaded → processing → extracted → embedded → published`, plus `failed`/`archived`), stores `doc_type`, `extracted_text`, `scopes[]`, `confidence`, storage path.
  - `knowledge_chunks` — chunked + embedded text (`embedding vector(1536)`), one-to-many with `knowledge_sources`.
  - Row Level Security on both tables (owner-only: `studio_director` + `super_admin`), a private Storage bucket for the raw files, and audit-log wiring.
- `supabase/migrations/20260713000200_knowledge_rpcs.sql`
  - `create_knowledge_source`, `update_knowledge_source_extraction`, `publish_knowledge_source` (writes chunks + audit rows), `match_knowledge_chunks` (pgvector cosine search via `<=>`, scope-filtered).
  - All RPCs are `SECURITY DEFINER`. `match_knowledge_chunks` needed `extensions` added to its `search_path` (the `<=>` operator lives in the `extensions` schema in this Supabase setup) — see spec §14 deviations.

### 2. Domain module (`packages/domain/src/knowledge/`)
Framework-free, pure TypeScript — no Next.js, no HTTP — so a future background worker can reuse it unchanged:
- `types.ts` / `schemas.ts` — `KnowledgeSource`, `KnowledgeChunk`, Zod schemas for every input.
- `repository.ts` — the repository interface (create/update/publish/match), implemented twice: `mock-repository.ts` (in-memory, deterministic) and, on the web app side, a Supabase-backed implementation.
- `chunk.ts` — text chunker (fixed-size with overlap) used before embedding.
- `policy-guard.ts` — decides whether a Test Lab question is answerable given the retrieved sources (refuses instead of hallucinating when nothing relevant was found).

### 3. AI Gateway (`apps/web/src/lib/ai/gateway/`)
Central module so no UI code or route ever calls an LLM/embeddings provider directly:
- `index.ts` — alias-addressed functions: `embedText`, `embedTexts`, `extractImageText`, `answerFromContext`. Callers never name a provider.
- `openai-adapter.ts` — real OpenAI calls (`text-embedding-3-small` for embeddings, `gpt-4o-mini` for vision + answers), server-only, no prompt logging.
- `mock-adapter.ts` — deterministic hash-based fallback (stable pseudo-vectors, canned answers) used whenever `OPENAI_API_KEY` is absent, so build/test/CI never need a real key or incur cost.
- `config.ts` / `types.ts` — model alias table and shared types.

This was implemented as an `apps/web/src/lib` module rather than a new `packages/ai` workspace package (spec §13 open question Q1) — only two workspace packages existed and a third wasn't justified for MVP.

### 4. Extractors (`apps/web/src/lib/knowledge/extract/`)
Per file type, rule-based first, LLM only where needed:
- `spreadsheet.ts` — `.xlsx`/`.xls`/`.csv` → flattened text (no AI call needed).
- `pdf.ts` — PDF text extraction, with vision fallback for scanned/image-only PDFs.
- `image.ts` — `.png`/`.jpg`/`.jpeg` → AI Gateway vision call (`extractImageText`).
- `index.ts` — dispatches by MIME/extension to the right extractor.

### 5. Orchestrators + server actions (`apps/web/src/lib/knowledge/server/`, `apps/web/src/features/knowledge-studio/`)
- Pure orchestrators (no Next.js request/response coupling): `submit-upload-knowledge-source.ts`, `submit-publish-knowledge-source.ts`, `submit-knowledge-query.ts`. Each does Zod validation → RBAC check → domain use case → audit.
- Thin `"use server"` action wrappers call the orchestrators: `upload-knowledge-action.ts`, `publish-knowledge-action.ts`, `query-knowledge-action.ts`.
- **Deviation from spec:** the original design sketched REST route handlers (`POST /api/knowledge/...`). The repo has no existing mutation-route-handler pattern, so this MVP uses Next.js Server Actions instead. The "thin transport over a pure use case" seam is preserved either way — swapping in an `event_outbox` worker later means calling the same orchestrators, not rewriting them.
- `knowledge-rpcs.ts` wraps the Supabase RPC calls (including the `JSON.stringify(embedding)` cast used to pass the query vector into `match_knowledge_chunks` — see spec §14).
- `repository-factory.ts` picks mock vs Supabase repository based on `HOM_DATA_MODE`; it and `createSupabaseServerClient` are both `async` (the Supabase server client reads cookies via `next/headers`), so every caller awaits `getKnowledgeRepository()`.
- Storage upload in `submit-upload-knowledge-source.ts` uses the Supabase **service-role admin client** server-side (not the anon/user client) — access control is enforced by the RBAC check in the orchestrator before the upload call runs.

### 6. UI (`apps/web/src/features/knowledge-studio/`, `apps/web/src/app/knowledge-studio/`, `apps/web/src/app/settings/ai-management/knowledge-studio/`)
- Replaces the old "Segera hadir" placeholder and fixes the dead-end "Review knowledge" header CTA.
- `knowledge-studio-page.tsx` + `knowledge-studio-page-loader.ts` / `-page-state.ts` — sources list with loading/empty/error/permission-denied states.
- `knowledge-upload-panel.tsx` — upload + extraction review (edit text, set scope, confidence) before publish.
- `knowledge-sources-table.tsx` — list of sources with status.
- `knowledge-test-lab.tsx` — ask a question, get an answer with cited sources, policy-guard refusal when nothing relevant is found.
- Storybook stories for the upload panel and the full page (`*.stories.tsx`) cover the state variants.

## How to run this locally

1. Reset the local Supabase database so the new tables/RPCs/RLS exist:
   ```bash
   ./node_modules/.bin/supabase.CMD db reset
   ```
2. In `apps/web/.env.local`, set:
   ```
   HOM_DATA_MODE=supabase
   HOM_AUTH_MODE=supabase
   ```
   (plus the existing `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` for your local Docker Supabase instance.)
3. Optional: set `OPENAI_API_KEY` in `apps/web/.env.local` to use real embeddings + vision. If it's absent, the AI Gateway automatically falls back to the deterministic mock adapter — everything still works (uploads, extraction, publish, Test Lab), just with canned/hashed output instead of real model output.
4. `corepack pnpm --dir apps/web dev` → open `/settings/ai-management/knowledge-studio` (or `/knowledge-studio`), log in as the seeded `studio_director`, upload a file, review, publish, then try a Test Lab question.

## Known limitation

Processing (extract → chunk → embed) runs **synchronously** inside the server action that handles the request, because there is no background worker yet (`apps/worker` + `event_outbox` are still docs-only in this repo). This means large multi-page PDFs or many images at once can approach serverless/function time limits. This is acceptable for MVP and local development. The domain use cases were written with no HTTP/Next.js coupling specifically so that a future `event_outbox`-driven worker can call the same functions with no logic changes — only the entry point moves from "inline in the request" to "picked up by a worker."

## Out of scope (not built in this phase)

- **Sub-project 2:** wiring the knowledge retrieval use case into Live Chat / WhatsApp auto-reply and the AI Business Agent. This is a separate, approval-gated spec because it touches a sensitive, customer-facing domain.
- Business Rules Editor, Chatbot Behavior Profile, Behavior Intelligence, suggested-knowledge-update loop (`docs/06` §3.5/§3.6/§9/§10).
- DOCX support, advanced spreadsheet-as-finance-data mapping beyond basic text extraction, rollback UI beyond simple status changes.

## Verification

See `.superpowers/sdd/task-20-report.md` for the full output of all automated verification commands (domain unit tests, web unit tests, typecheck, lint, build, and the scoped `knowledge-studio` Playwright e2e spec) run for this phase.
