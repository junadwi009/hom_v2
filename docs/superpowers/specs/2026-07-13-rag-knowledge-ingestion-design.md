# RAG Knowledge Ingestion MVP — Design Spec

- **Date:** 2026-07-13
- **Status:** Implemented (Sub-project 1 — MVP; see `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md`)
- **Author:** Claude (with owner)
- **Related design source of truth:** [`docs/06_AI_KNOWLEDGE_STUDIO.md`](../../06_AI_KNOWLEDGE_STUDIO.md)
- **Working agreement:** [`AGENTS.md`](../../../AGENTS.md), [`CLAUDE.md`](../../../CLAUDE.md)

---

## 1. Goal (plain language)

Let the studio owner upload business documents — **Excel (.xlsx/.xls), CSV, PDF, and images (JPG/PNG/JPEG)** — and turn them into a searchable AI knowledge base (RAG). The owner reviews what the system extracted, then publishes it. A **Test Lab** box lets the owner ask a question and get an answer **with cited sources**.

This replaces the current "Segera hadir" placeholder at `/settings/ai-management/knowledge-studio` and fixes the dead-end **"Review knowledge"** header CTA found in the audit.

## 2. Scope

### In scope — Sub-project 1 (this spec)
Maps to `docs/06` §5 pipeline and MVP build order steps 1–9.

1. Upload of `.xlsx`, `.xls`, `.csv`, `.pdf`, `.png`, `.jpg`, `.jpeg` to Supabase Storage (private bucket).
2. `knowledge_sources` + `knowledge_chunks` tables (pgvector), RLS, audit.
3. Extraction per file type (Excel/CSV parser, PDF text + vision fallback, image vision).
4. Owner **extraction review** screen (edit text, set scope, confidence) — human-in-the-loop.
5. Chunking + embeddings (OpenAI `text-embedding-3-small`, 1536-dim) into pgvector.
6. Publish / archive via the existing `knowledge_source_status` lifecycle.
7. Scope-filtered vector **retrieval** use case.
8. **Test Lab** UI: ask question → answer + sources + policy guard.
9. Central **AI Gateway** module with model aliases + OpenAI adapter + deterministic mock fallback.

### Out of scope — future sub-projects
- **Sub-project 2:** wiring retrieval into Live Chat / WhatsApp auto-reply and the AI Business Agent (sensitive domain, approval-gated — separate spec).
- Business Rules Editor (`docs/06` §3.5), Chatbot Behavior Profile (§3.6), Behavior Intelligence (§9), suggested-knowledge-update loop (§10).
- DOCX support, advanced spreadsheet-as-finance-data mapping (§3.4 beyond basic text), rollback UI beyond status changes.

## 3. Constraints (from AGENTS.md / CLAUDE.md)

- Locked stack only: Next.js + TS strict, Supabase (Postgres + Storage + pgvector), Tailwind/shadcn.
- **No FastAPI/Python in Phase 1.** OpenAI's cloud vision handles OCR, so no local OCR service is needed.
- **All LLM calls go through the AI Gateway**, addressed by **model alias** not hardcoded provider.
- **No direct LLM calls or DB writes from UI components.** Business logic lives in `packages/domain` / server use cases.
- Validate every server input with **Zod**.
- Every screen has loading / empty / error / permission-denied / success states.
- **Never** show fake zero values on load failure.
- Secrets are server-only; scrub prompts/PII/secrets from logs.
- Knowledge **publish** is a sensitive, audited action.

## 4. Architecture

### 4.1 Processing model — synchronous in-app (Approach 1)

No background worker exists yet (`apps/worker` / `event_outbox` are docs-only). For the MVP we process **synchronously** inside server-side route handlers, driven by a status state machine so the UI can show progress by polling.

```
Owner uploads file (UI)
  → POST /api/knowledge/sources            (create row, status=uploaded, store file)
  → POST /api/knowledge/sources/:id/process (status=processing → extracted | failed)
  → Owner reviews & edits extracted text (UI)
  → POST /api/knowledge/sources/:id/publish (chunk → embed → status=embedded → published)
  → Test Lab: POST /api/knowledge/query    (retrieve + answer + sources)
```

**Seam for the future worker:** extraction, chunking, and embedding are written as **pure use cases** in `packages/domain/src/knowledge/` (no HTTP, no Next.js). The route handlers are thin adapters that call them. Later, an `event_outbox` worker can call the same use cases with zero logic change.

**Timeout note (documented limitation):** large multi-page PDFs / many images may approach serverless time limits under synchronous processing. Acceptable for MVP/local; the worker migration (Sub-project follow-up) removes this ceiling.

### 4.2 AI Gateway (`docs/06` §11)

New module (proposed `packages/ai`, or `apps/web/src/lib/ai/gateway` if a package is too heavy for MVP — decide in planning). Exposes alias-addressed functions; callers never name a provider:

| Alias | MVP mapping | Used by |
|---|---|---|
| `embedding_model` | OpenAI `text-embedding-3-small` (1536-d) | chunk embedding, query embedding |
| `vision_document_model` | OpenAI `gpt-4o-mini` (vision) | image extraction, scanned-PDF fallback |
| `answer_model` | OpenAI `gpt-4o-mini` | Test Lab answer generation |

- **OpenAI adapter:** server-only, timeout + no prompt logging (mirrors existing `openrouter-client.ts`).
- **Mock adapter (fallback when `OPENAI_API_KEY` is absent):**
  - `embedding_model` → deterministic hash-based pseudo-vector (stable across runs; lets retrieval work offline).
  - `vision_document_model` → returns a clearly labelled placeholder (`[mock vision extraction: <filename>]`).
  - `answer_model` → returns a canned "demo answer" that still lists the real retrieved chunks.
  - Excel/CSV/PDF-text extraction need **no AI**, so they work fully in mock mode.
- Selection is driven by env (`OPENAI_API_KEY` present) and the existing app-mode philosophy; surfaced to the UI as a "demo/mock mode" badge (never fake success).

### 4.3 Package / file layout (proposed)

```
packages/domain/src/knowledge/
  types.ts            # KnowledgeSource, KnowledgeChunk, Scope, Status
  schemas.ts          # Zod: upload input, review input, query input
  repository.ts       # interface (real + mock impls)
  mock-repository.ts
  extract/
    spreadsheet.ts    # xlsx/csv → structured text (SheetJS)
    pdf.ts            # unpdf text extract; signals when vision fallback needed
    image.ts          # builds vision request payload
  chunk.ts            # text → chunks (size/overlap)
  retrieval.ts        # scope filter + top-k selection (pure, embedding provided)
  policy-guard.ts     # docs/06 §8 answer guardrails
  index.ts

apps/web/src/lib/ai/gateway/     # or packages/ai
  aliases.ts
  openai-adapter.ts
  mock-adapter.ts
  index.ts

apps/web/src/app/api/knowledge/  # route handlers (thin)
  sources/route.ts                 # POST create+upload, GET list
  sources/[id]/route.ts            # GET detail, PATCH review edits
  sources/[id]/process/route.ts    # POST extract
  sources/[id]/publish/route.ts    # POST chunk+embed+publish
  query/route.ts                   # POST Test Lab query

apps/web/src/features/knowledge-studio/   # UI (replaces placeholder)
  sources-list.tsx, upload-panel.tsx, extraction-review.tsx, test-lab.tsx
  + *.stories.tsx
```

## 5. Data model

### 5.1 Migration: enable pgvector
```sql
create extension if not exists vector with schema extensions;
```

### 5.2 `public.knowledge_sources`
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| title | text not null | |
| doc_type | text not null | e.g. pricing, sop, faq, campaign |
| scopes | text[] not null | subset of the 6 scopes (§6) |
| storage_path | text not null | path in `knowledge-sources` bucket |
| mime_type | text not null | whitelist-checked |
| file_size | bigint not null | |
| checksum | text | sha256 for dedup |
| status | public.knowledge_source_status not null default 'uploaded' | existing enum |
| extracted_text | text | editable in review |
| confidence | numeric(4,3) | 0–1, from extractor |
| version | int not null default 1 | |
| uploaded_by | uuid not null | auth.uid() |
| published_at | timestamptz | |
| error | text | populated on `failed` |
| created_at / updated_at | timestamptz | |

### 5.3 `public.knowledge_chunks`
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| source_id | uuid fk → knowledge_sources on delete cascade | |
| chunk_index | int not null | |
| content | text not null | |
| embedding | `extensions.vector(1536)` | |
| token_count | int | |
| created_at | timestamptz | |

Index: HNSW (or ivfflat) on `embedding` with cosine ops. Choose in planning based on local pgvector version; default HNSW if available.

### 5.4 RLS & permissions
- Both tables RLS-enabled.
- **Read/write** allowed only to `studio_director` and `super_admin` (owner-level) via the existing RBAC helpers/`role_permissions`.
- Retrieval further filters by `scopes` and by `status in ('published')` (never draft/archived/failed) — `docs/06` §7.
- All writes recorded through the existing **audit** module (`packages/domain/src/audit`), with PII/content redaction.

### 5.5 Storage
- New **private** bucket `knowledge-sources` (Supabase Storage). Signed URLs server-side only; no public access.
- MIME whitelist + max size enforced both client- and server-side.

## 6. Knowledge scopes (`docs/06` §4)
`public_chatbot`, `internal_admin`, `clinical_safety`, `finance`, `marketing`, `owner_only`. Stored as `scopes text[]`; retrieval takes an allowed-scope set and filters chunks accordingly.

## 7. Ingestion per file type

| Type | Extraction | AI needed? |
|---|---|---|
| `.xlsx` / `.xls` | SheetJS → sheets/rows → text lines (`Header: value`); owner picks header row in review | No |
| `.csv` | Direct structured parse → text lines | No |
| `.pdf` | `unpdf` text layer; if empty/low-text (scanned) → render pages → `vision_document_model` | Only for scanned |
| `.png` / `.jpg` / `.jpeg` | `vision_document_model` → text + short description | Yes |

- Extraction returns `{ text, confidence, warnings[] }`.
- Chunking: target ~500–800 tokens, small overlap; configurable constant.
- Embedding runs on **publish** (after owner review), not on upload — saves cost and honours human-in-the-loop.

## 8. Retrieval & Test Lab

1. Owner asks a question in Test Lab (choose scope, default `public_chatbot`).
2. Embed the query (`embedding_model`).
3. Vector search `knowledge_chunks` filtered by scope + `published`, top-k (e.g. 5) by cosine distance.
4. Build a grounded prompt with retrieved chunks; call `answer_model`.
5. Run **policy guard** (`docs/06` §8): no diagnosis, no healing/refund promises, no unapproved discounts, no reschedule confirmation, no finance/clinical leakage. Violations → safe fallback answer.
6. Return `{ answer, sources[], confidence, policyFlags[], latencyMs }`. If retrieval is empty → honest "no knowledge found for this scope" (not a fabricated answer).

## 9. UI (replaces placeholder page)

Page `/settings/ai-management/knowledge-studio`, plus the topbar **"Review knowledge"** CTA now lands on a working page.

- **Sources list** — columns Title / Type / Scope / Status / Version / Uploaded by / Actions. States: loading, empty ("upload your first document"), error (honest), success.
- **Upload panel** — Title, Document type, Scope(s); Zod-validated; MIME + size guard; shows mock-mode badge when no API key.
- **Extraction review** — editable extracted text, detected confidence, scope, warnings; **Publish** and **Archive** actions (publish is audited).
- **Test Lab** — question box + scope selector; shows answer, **source list**, policy flags, latency; empty/error states.

All UI uses shadcn/Radix + design tokens; restrained Motion with reduced-motion respected.

## 10. Environment variables
- `OPENAI_API_KEY` — server-only; absent ⇒ mock mode. Add **name only** to `.env.example`.
- Reuse existing `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `HOM_DATA_MODE`.
- No secret values committed.

## 11. Testing (scale with risk)
- **Unit:** spreadsheet mapper, chunker, mock-embedding determinism, retrieval scope filter, policy guard.
- **Integration:** RLS (non-owner denied), upload→process→publish status transitions, audit rows written, retrieval excludes non-published/other-scope.
- **Storybook:** each UI component with loading/empty/error/success.
- **Playwright smoke:** upload a tiny fixture (xlsx + png) → review → publish → Test Lab returns an answer citing the source. Runnable in mock mode (no API key) in CI.

## 12. Implementation phases (ordered — do not skip ahead)
1. **DB foundation:** enable pgvector, create tables + RLS + storage bucket + audit wiring. Verify via psql impersonation.
2. **Domain layer:** types/schemas/repository (+ mock), extractors, chunker, retrieval, policy guard, unit tests.
3. **AI Gateway:** alias module + OpenAI adapter + mock adapter + tests.
4. **API routes:** create/upload, process, review PATCH, publish, query — Zod-validated, RBAC-guarded.
5. **UI:** sources list → upload → extraction review → Test Lab, with Storybook stories; wire page + fix CTA.
6. **E2E + docs:** Playwright smoke; write `PHASE_*` log; update `.env.example` and this spec's status.

## 13. Assumptions & open questions
- **A1:** Owner-only access (studio_director + super_admin) is correct for MVP. *(assume yes)*
- **A2:** OpenAI models `text-embedding-3-small` + `gpt-4o-mini` are acceptable defaults (cost-efficient). *(assume yes; overridable via alias config)*
- **A3:** Synchronous processing is acceptable for MVP file sizes; worker migration is a later sub-project. *(assume yes)*
- **Q1:** AI Gateway as a new `packages/ai` package vs an `apps/web` lib module — decide in planning (lean lib for MVP, extract to package if reused).
- **Q2:** HNSW vs ivfflat index — decide in planning per local pgvector version.

## 14. Deviations from spec during implementation

- **Server actions instead of REST route handlers.** §4.1 sketched `POST /api/knowledge/...` routes. The repo has no existing mutation route-handler pattern, so ingestion is implemented as Next.js `"use server"` actions (`upload-knowledge-action.ts`, `publish-knowledge-action.ts`, `query-knowledge-action.ts`) backed by pure `submit-*` orchestrators (`apps/web/src/lib/knowledge/server/submit-upload-knowledge-source.ts`, `submit-publish-knowledge-source.ts`, `submit-knowledge-query.ts`). The orchestrators still call the pure `packages/domain` use cases, so the "thin adapter over a pure use case" seam from §4.1 is preserved — only the transport changed.
- **AI Gateway is an `apps/web/src/lib` module, not `packages/ai`.** Resolves open question Q1 in favor of the lib option: `apps/web/src/lib/ai/gateway/{index,config,types,openai-adapter,mock-adapter}.ts`. No second workspace package was justified for MVP; extraction to `packages/ai` remains an option if the gateway is reused outside `apps/web`.
- **`createSupabaseServerClient` and the repository factory are async.** The existing Supabase server-client helper returns a Promise (it reads cookies via `next/headers`), so `apps/web/src/lib/knowledge/repository-factory.ts` and all callers (`getKnowledgeRepository()`) are `async` and must be awaited — this wasn't spelled out in §4/§5.
- **Storage upload uses the service-role admin client.** File upload to the private Storage bucket in `submit-upload-knowledge-source.ts` goes through the Supabase admin (service-role) client server-side, not the anon/user client, so RLS-equivalent checks are enforced in the use case/RBAC layer before the upload call rather than relying on Storage-level RLS alone.
- **`match_knowledge_chunks` needed `extensions` in its `search_path`.** The pgvector `<=>` operator lives in the `extensions` schema in this Supabase setup; the RPC's `SECURITY DEFINER search_path` had to include `extensions` (alongside `public`) or the operator resolved to nothing. See migration `20260713000200_knowledge_rpcs.sql`.
- **Query embedding is passed as a JSON string, not a native array.** Resolves open question in T11/T13: the RPC parameter for the query vector is passed as a JSON-stringified array (`JSON.stringify(embedding)`) and cast to `vector` inside SQL, rather than relying on the Postgres client to marshal a JS `number[]` directly — this was the reliable path with the driver in use.
