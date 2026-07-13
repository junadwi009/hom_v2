# RAG Knowledge Ingestion MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the studio owner upload Excel/CSV/PDF/JPG/PNG/JPEG documents, review the extracted text, embed it into pgvector, and ask questions in a Test Lab that answers with cited sources — replacing the Knowledge Studio placeholder.

**Architecture:** Synchronous server-side processing via Next.js `"use server"` actions → `submit-*` server-only orchestrators → Postgres `SECURITY DEFINER` RPCs (the repo's established write path; no REST route handlers). Pure logic (schemas, chunking, policy guard) lives in `packages/domain/src/knowledge`; library-dependent logic (file extraction, OpenAI calls) lives in `apps/web/src/lib`. All LLM/embedding calls go through a new alias-addressed AI Gateway with a deterministic mock fallback so the feature builds and tests with **no API key**.

**Tech Stack:** Next.js 16 / React 19 / TypeScript strict, Zod 4, Supabase (Postgres + pgvector + Storage), `openai`, `xlsx` (SheetJS), `unpdf`. Vitest (unit), Playwright (e2e), Storybook 10.

**Design source of truth:** `docs/superpowers/specs/2026-07-13-rag-knowledge-ingestion-design.md` and `docs/06_AI_KNOWLEDGE_STUDIO.md`.

## Global Constraints

- **TypeScript strict**; validate every server input with **Zod 4**; every object schema `.strict()`.
- **No LLM/DB calls from React components.** LLM/embedding calls go **only** through `apps/web/src/lib/ai/gateway`. Business logic in `packages/domain` or server-only `lib/**/server`.
- **All backend writes** go through a Postgres `SECURITY DEFINER` RPC that re-checks auth + permission and writes an explicit `audit_logs` row; RPC errors use `errcode = 'P0001'` with `UPPER_SNAKE_CASE` messages.
- **RBAC:** manage actions require permission `can_manage_knowledge`; publish requires `can_publish_knowledge`. Both already exist in the DB constraint/seed and the domain `permissionKeys` tuple. Owner roles = `super_admin`, `studio_director`.
- **Mode gating:** every mutation orchestrator returns a `configuration_error` state unless `getDataMode() === "supabase" && getAuthMode() === "supabase"`.
- **API-key fallback:** absent `OPENAI_API_KEY` ⇒ gateway runs in **mock** mode (never an error, surfaced as a demo badge). Read key with `readTrimmedEnv("OPENAI_API_KEY")` (server-only); never return it to the client.
- **Every screen** has loading / empty / error / permission-denied / success states. Never render fake zero values on load failure.
- **Secrets/PII** never logged; audit metadata passes through `redactAuditMetadata` before insert.
- **Migration naming:** `supabase/migrations/20260713000100_*.sql` (increment `000200`, … for same-day files).
- **pnpm:** `corepack pnpm@11.3.0`. Run domain tests with `corepack pnpm --filter @hom/domain test`; web tests with `corepack pnpm --dir apps/web test`.
- **Knowledge scopes** (`text[]`): `public_chatbot`, `internal_admin`, `clinical_safety`, `finance`, `marketing`, `owner_only`.
- **Embedding dim:** 1536 (OpenAI `text-embedding-3-small`). Vector column `extensions.vector(1536)`.

---

## Phase 1 — Database foundation

### Task 1: Migration — pgvector, tables, RLS, storage bucket

**Files:**
- Create: `supabase/migrations/20260713000100_knowledge_ingestion_tables.sql`

**Interfaces:**
- Produces (SQL objects later tasks rely on): tables `public.knowledge_sources`, `public.knowledge_chunks`; storage bucket `knowledge-sources`; read policies keyed on `private.has_permission('can_manage_knowledge') or private.has_owner_role()`.

- [ ] **Step 1: Write the migration**

```sql
-- 20260713000100_knowledge_ingestion_tables.sql
-- RAG Knowledge Ingestion MVP: pgvector + knowledge tables + RLS + storage bucket.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- Sources: one row per uploaded document.
create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text not null,
  scopes text[] not null default '{}'::text[],
  storage_path text not null,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  checksum text,
  status public.knowledge_source_status not null default 'uploaded',
  extracted_text text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  version int not null default 1 check (version >= 1),
  uploaded_by uuid not null references public.app_users(id),
  published_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_sources_scopes_nonempty check (array_length(scopes, 1) is not null)
);

comment on table public.knowledge_sources is
  'Uploaded knowledge documents for the RAG layer. Writes only via SECURITY DEFINER RPCs.';

create index knowledge_sources_status_idx on public.knowledge_sources (status);
create index knowledge_sources_scopes_idx on public.knowledge_sources using gin (scopes);

create trigger set_knowledge_sources_updated_at
before update on public.knowledge_sources
for each row execute function private.set_updated_at();

-- Chunks: embedded text fragments for retrieval.
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_index int not null check (chunk_index >= 0),
  content text not null,
  embedding extensions.vector(1536) not null,
  token_count int check (token_count is null or token_count >= 0),
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

comment on table public.knowledge_chunks is
  'Embedded chunks of published knowledge sources. Retrieval via match_knowledge_chunks RPC.';

create index knowledge_chunks_source_idx on public.knowledge_chunks (source_id);
create index knowledge_chunks_embedding_idx on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- Deny-by-default RLS (writes only through RPCs).
alter table public.knowledge_sources enable row level security;
revoke all on public.knowledge_sources from public, anon, authenticated;
grant select on public.knowledge_sources to authenticated;

alter table public.knowledge_chunks enable row level security;
revoke all on public.knowledge_chunks from public, anon, authenticated;
grant select on public.knowledge_chunks to authenticated;

create policy "knowledge managers can read sources"
on public.knowledge_sources
for select
to authenticated
using (private.has_permission('can_manage_knowledge') or private.has_owner_role());

create policy "knowledge managers can read chunks"
on public.knowledge_chunks
for select
to authenticated
using (private.has_permission('can_manage_knowledge') or private.has_owner_role());

-- Private storage bucket for raw files (accessed server-side via service role).
insert into storage.buckets (id, name, public)
values ('knowledge-sources', 'knowledge-sources', false)
on conflict (id) do nothing;
```

- [ ] **Step 2: Apply and verify the schema**

Run:
```bash
corepack pnpm exec supabase db reset
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At -c "select count(*) from public.knowledge_sources;"
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At -c "select extname from pg_extension where extname='vector';"
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At -c "select id from storage.buckets where id='knowledge-sources';"
```
Expected: `0`, then `vector`, then `knowledge-sources`.

- [ ] **Step 3: Verify RLS denies a non-owner (psql impersonation)**

Run (pipe via `docker exec -i` to avoid PowerShell arg-splitting):
```bash
printf '%s\n' "begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000ff'; select count(*) from public.knowledge_sources; rollback;" | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At
```
Expected: `0` rows visible (no error; the anonymous sub has no owner role, and there is no data yet). This confirms the policy compiles and the grant path works.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260713000100_knowledge_ingestion_tables.sql
git commit -m "feat(db): knowledge ingestion tables, pgvector, RLS, storage bucket"
```

---

### Task 2: Migration — write + retrieval RPCs

**Files:**
- Create: `supabase/migrations/20260713000200_knowledge_rpcs.sql`

**Interfaces:**
- Produces (RPCs later TS tasks call):
  - `public.create_knowledge_source(p_title text, p_doc_type text, p_scopes text[], p_storage_path text, p_mime_type text, p_file_size bigint, p_checksum text) returns setof private.knowledge_source_rows`
  - `public.set_knowledge_source_extracted(p_id uuid, p_extracted_text text, p_confidence numeric) returns setof private.knowledge_source_rows`
  - `public.fail_knowledge_source(p_id uuid, p_error text) returns setof private.knowledge_source_rows`
  - `public.publish_knowledge_source(p_id uuid, p_extracted_text text, p_chunks jsonb) returns setof private.knowledge_source_rows` (each chunk: `{ "index": int, "content": text, "embedding": number[1536], "tokenCount": int }`)
  - `public.match_knowledge_chunks(p_query_embedding extensions.vector, p_scopes text[], p_match_count int) returns table(source_id uuid, source_title text, chunk_index int, content text, distance float)`

- [ ] **Step 1: Write the RPC migration**

```sql
-- 20260713000200_knowledge_rpcs.sql
-- Row-shape view + write/retrieval RPCs for knowledge ingestion.

create or replace view private.knowledge_source_rows as
select
  ks.id, ks.title, ks.doc_type, ks.scopes, ks.storage_path, ks.mime_type,
  ks.file_size, ks.status, ks.extracted_text, ks.confidence, ks.version,
  ks.uploaded_by, ks.published_at, ks.error, ks.created_at, ks.updated_at
from public.knowledge_sources ks;

-- Helper: resolve active app_user or raise.
-- (Inlined per RPC below, matching the repo convention.)

create or replace function public.create_knowledge_source(
  p_title text, p_doc_type text, p_scopes text[], p_storage_path text,
  p_mime_type text, p_file_size bigint, p_checksum text
) returns setof private.knowledge_source_rows
language plpgsql security definer set search_path = public, private as $$
declare v_actor public.app_users; v_id uuid;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not private.has_permission('can_manage_knowledge') then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;
  if coalesce(trim(p_title),'')='' then raise exception using errcode='P0001', message='TITLE_REQUIRED'; end if;
  if array_length(p_scopes,1) is null then raise exception using errcode='P0001', message='SCOPES_REQUIRED'; end if;

  insert into public.knowledge_sources (title, doc_type, scopes, storage_path, mime_type, file_size, checksum, status, uploaded_by)
  values (trim(p_title), p_doc_type, p_scopes, p_storage_path, p_mime_type, p_file_size, p_checksum, 'uploaded', v_actor.id)
  returning id into v_id;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'knowledge.source.created', 'knowledge_source', v_id, 'low',
          jsonb_build_object('docType', p_doc_type));

  return query select * from private.knowledge_source_rows where id = v_id;
end $$;

create or replace function public.set_knowledge_source_extracted(
  p_id uuid, p_extracted_text text, p_confidence numeric
) returns setof private.knowledge_source_rows
language plpgsql security definer set search_path = public, private as $$
declare v_actor public.app_users;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not private.has_permission('can_manage_knowledge') then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;

  update public.knowledge_sources
  set status='extracted', extracted_text=p_extracted_text, confidence=p_confidence, error=null
  where id=p_id;
  if not found then raise exception using errcode='P0001', message='SOURCE_NOT_FOUND'; end if;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'knowledge.source.extracted', 'knowledge_source', p_id, 'low', '{}'::jsonb);

  return query select * from private.knowledge_source_rows where id = p_id;
end $$;

create or replace function public.fail_knowledge_source(p_id uuid, p_error text)
returns setof private.knowledge_source_rows
language plpgsql security definer set search_path = public, private as $$
declare v_actor public.app_users;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not private.has_permission('can_manage_knowledge') then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;

  update public.knowledge_sources set status='failed', error=left(coalesce(p_error,'Unknown error'),500) where id=p_id;
  if not found then raise exception using errcode='P0001', message='SOURCE_NOT_FOUND'; end if;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'knowledge.source.failed', 'knowledge_source', p_id, 'medium', '{}'::jsonb);

  return query select * from private.knowledge_source_rows where id = p_id;
end $$;

create or replace function public.publish_knowledge_source(
  p_id uuid, p_extracted_text text, p_chunks jsonb
) returns setof private.knowledge_source_rows
language plpgsql security definer set search_path = public, private as $$
declare v_actor public.app_users; v_chunk jsonb;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not private.has_permission('can_publish_knowledge') then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;
  if jsonb_typeof(p_chunks) is distinct from 'array' or jsonb_array_length(p_chunks)=0 then
    raise exception using errcode='P0001', message='CHUNKS_REQUIRED'; end if;

  update public.knowledge_sources set status='embedded', extracted_text=p_extracted_text, error=null where id=p_id;
  if not found then raise exception using errcode='P0001', message='SOURCE_NOT_FOUND'; end if;

  delete from public.knowledge_chunks where source_id=p_id;
  for v_chunk in select * from jsonb_array_elements(p_chunks) loop
    insert into public.knowledge_chunks (source_id, chunk_index, content, embedding, token_count)
    values (
      p_id,
      (v_chunk->>'index')::int,
      v_chunk->>'content',
      (v_chunk->>'embedding')::extensions.vector,
      nullif(v_chunk->>'tokenCount','')::int
    );
  end loop;

  update public.knowledge_sources set status='published', published_at=now() where id=p_id;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'knowledge.source.published', 'knowledge_source', p_id, 'high',
          jsonb_build_object('chunkCount', jsonb_array_length(p_chunks)));

  return query select * from private.knowledge_source_rows where id = p_id;
end $$;

create or replace function public.match_knowledge_chunks(
  p_query_embedding extensions.vector, p_scopes text[], p_match_count int
) returns table(source_id uuid, source_title text, chunk_index int, content text, distance float)
language plpgsql security definer set search_path = public, private as $$
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  if not (private.has_permission('can_manage_knowledge') or private.has_owner_role()) then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;

  return query
  select kc.source_id, ks.title, kc.chunk_index, kc.content,
         (kc.embedding <=> p_query_embedding) as distance
  from public.knowledge_chunks kc
  join public.knowledge_sources ks on ks.id = kc.source_id
  where ks.status = 'published'
    and ks.scopes && p_scopes
  order by kc.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 5), 20));
end $$;

-- Grants: owner-authenticated only; no public/anon.
do $$
declare fn text;
begin
  for fn in select unnest(array[
    'create_knowledge_source(text,text,text[],text,text,bigint,text)',
    'set_knowledge_source_extracted(uuid,text,numeric)',
    'fail_knowledge_source(uuid,text)',
    'publish_knowledge_source(uuid,text,jsonb)',
    'match_knowledge_chunks(extensions.vector,text[],integer)'
  ]) loop
    execute format('revoke all on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end $$;
```

- [ ] **Step 2: Apply and verify the write→publish→retrieve path as the seeded studio_director**

Run:
```bash
corepack pnpm exec supabase db reset
printf '%s\n' "
begin;
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';
select id, status from public.create_knowledge_source('Pricing 2026','pricing', array['public_chatbot'], 'knowledge-sources/x.pdf','application/pdf', 100, null);
rollback;" | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At
```
Expected: one row with a uuid and `uploaded`.

- [ ] **Step 3: Verify permission gate rejects a non-owner**

Run:
```bash
printf '%s\n' "
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000ff';
select public.create_knowledge_source('x','pricing',array['public_chatbot'],'p','application/pdf',1,null);
rollback;" | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At 2>&1 | head -1
```
Expected: an error line containing `APP_USER_REQUIRED` (or `PERMISSION_DENIED`) — the write is refused.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260713000200_knowledge_rpcs.sql
git commit -m "feat(db): knowledge source write + match RPCs with audit + RBAC"
```

---

## Phase 2 — Domain layer (`packages/domain/src/knowledge`)

### Task 3: Schemas, types, barrel, registration

**Files:**
- Create: `packages/domain/src/knowledge/schemas.ts`, `types.ts`, `index.ts`
- Create: `packages/domain/tests/knowledge.test.ts`
- Modify: `packages/domain/src/index.ts` (add `export * from "./knowledge";` alphabetically, after `./clients`/`./catalog` grouping)
- Modify: `packages/domain/package.json` (add `"./knowledge": "./src/knowledge/index.ts"` to `exports`, alphabetical)

**Interfaces:**
- Produces: `knowledgeScopeSchema`, `knowledgeSourceSchema`, `createKnowledgeSourceInputSchema`, `publishKnowledgeSourceInputSchema`, `knowledgeQueryInputSchema`, `knowledgeSourceListResultSchema`; types `KnowledgeScope`, `KnowledgeSource`, `CreateKnowledgeSourceInput`, `PublishKnowledgeSourceInput`, `KnowledgeQueryInput`, `KnowledgeSourceListResult`.
- Consumes: `knowledgeSourceStatusSchema` from `../rbac`; `catalogIdSchema`, `catalogTimestampSchema`, `catalogListResultMetaSchema` from `../catalog`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/domain/tests/knowledge.test.ts
import { describe, expect, it } from "vitest";
import {
  knowledgeScopeSchema,
  knowledgeSourceSchema,
  createKnowledgeSourceInputSchema,
  knowledgeQueryInputSchema,
} from "../src/knowledge";

const baseSource = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Pricing 2026",
  docType: "pricing",
  scopes: ["public_chatbot"],
  status: "uploaded",
  version: 1,
  confidence: null,
  extractedText: null,
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
} as const;

describe("knowledgeScopeSchema", () => {
  it("accepts a known scope", () => {
    expect(() => knowledgeScopeSchema.parse("public_chatbot")).not.toThrow();
  });
  it("rejects an unknown scope", () => {
    expect(() => knowledgeScopeSchema.parse("nope")).toThrow();
  });
});

describe("knowledgeSourceSchema", () => {
  it("accepts a valid source", () => {
    expect(() => knowledgeSourceSchema.parse(baseSource)).not.toThrow();
  });
  it("rejects unknown keys", () => {
    expect(() => knowledgeSourceSchema.parse({ ...baseSource, extra: 1 })).toThrow();
  });
});

describe("createKnowledgeSourceInputSchema", () => {
  it("requires at least one scope", () => {
    expect(() =>
      createKnowledgeSourceInputSchema.parse({ title: "x", docType: "pricing", scopes: [] }),
    ).toThrow();
  });
});

describe("knowledgeQueryInputSchema", () => {
  it("accepts a question with a scope", () => {
    expect(() =>
      knowledgeQueryInputSchema.parse({ question: "Berapa harga private?", scope: "public_chatbot" }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm --filter @hom/domain test -- knowledge`
Expected: FAIL — cannot resolve `../src/knowledge`.

- [ ] **Step 3: Write schemas.ts**

```ts
// packages/domain/src/knowledge/schemas.ts
import { z } from "zod";
import { catalogIdSchema, catalogListResultMetaSchema, catalogTimestampSchema } from "../catalog";
import { knowledgeSourceStatusSchema } from "../rbac";

export const knowledgeScopeSchema = z.enum([
  "public_chatbot",
  "internal_admin",
  "clinical_safety",
  "finance",
  "marketing",
  "owner_only",
]);

export const knowledgeSourceSchema = z
  .object({
    id: catalogIdSchema,
    title: z.string().trim().min(1).max(160),
    docType: z.string().trim().min(1).max(60),
    scopes: z.array(knowledgeScopeSchema).min(1),
    status: knowledgeSourceStatusSchema,
    version: z.number().int().min(1),
    confidence: z.number().min(0).max(1).nullable(),
    extractedText: z.string().nullable(),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const createKnowledgeSourceInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    docType: z.string().trim().min(1).max(60),
    scopes: z.array(knowledgeScopeSchema).min(1),
  })
  .strict();

export const publishKnowledgeSourceInputSchema = z
  .object({
    sourceId: catalogIdSchema,
    extractedText: z.string().trim().min(1).max(200_000),
  })
  .strict();

export const knowledgeQueryInputSchema = z
  .object({
    question: z.string().trim().min(3).max(500),
    scope: knowledgeScopeSchema,
  })
  .strict();

export const knowledgeSourceListResultSchema = catalogListResultMetaSchema
  .extend({ items: z.array(knowledgeSourceSchema) })
  .strict();
```

- [ ] **Step 4: Write types.ts + index.ts and register**

```ts
// packages/domain/src/knowledge/types.ts
import type { z } from "zod";
import type {
  knowledgeScopeSchema,
  knowledgeSourceSchema,
  createKnowledgeSourceInputSchema,
  publishKnowledgeSourceInputSchema,
  knowledgeQueryInputSchema,
  knowledgeSourceListResultSchema,
} from "./schemas";

export type KnowledgeScope = z.infer<typeof knowledgeScopeSchema>;
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
export type CreateKnowledgeSourceInput = z.infer<typeof createKnowledgeSourceInputSchema>;
export type PublishKnowledgeSourceInput = z.infer<typeof publishKnowledgeSourceInputSchema>;
export type KnowledgeQueryInput = z.infer<typeof knowledgeQueryInputSchema>;
export type KnowledgeSourceListResult = z.infer<typeof knowledgeSourceListResultSchema>;
```

```ts
// packages/domain/src/knowledge/index.ts
export {
  createKnowledgeSourceInputSchema,
  knowledgeQueryInputSchema,
  knowledgeScopeSchema,
  knowledgeSourceListResultSchema,
  knowledgeSourceSchema,
  publishKnowledgeSourceInputSchema,
} from "./schemas";
export type { KnowledgeRepository } from "./repository";
export { createMockKnowledgeRepository, mockKnowledgeSources } from "./mock-repository";
export { chunkText } from "./chunk";
export { evaluateKnowledgeAnswer } from "./policy-guard";
export type {
  CreateKnowledgeSourceInput,
  KnowledgeQueryInput,
  KnowledgeScope,
  KnowledgeSource,
  KnowledgeSourceListResult,
  PublishKnowledgeSourceInput,
} from "./types";
```

In `packages/domain/src/index.ts` add (alphabetical): `export * from "./knowledge";`
In `packages/domain/package.json` `exports`, add: `"./knowledge": "./src/knowledge/index.ts"`.

(`repository`, `mock-repository`, `chunk`, `policy-guard` are added in the next tasks; the barrel references them now so those tasks compile the barrel.)

- [ ] **Step 5: Run test to verify schemas pass**

Run: `corepack pnpm --filter @hom/domain test -- knowledge`
Expected: the 4 schema `describe` blocks PASS (repository/chunk/policy tests come later; barrel imports for not-yet-created files will fail typecheck — create empty stubs `repository.ts`, `mock-repository.ts`, `chunk.ts`, `policy-guard.ts` exporting the referenced names as `throw new Error("not implemented")` placeholders **only if** the test run needs the barrel to resolve; otherwise import directly from `../src/knowledge/schemas` in this task's test and switch to the barrel in Task 4).

> To keep Step 5 green now, this test imports from `../src/knowledge` barrel; create the four files as minimal stubs in this task:
> `chunk.ts` → `export function chunkText(_t: string): string[] { return []; }`
> `policy-guard.ts` → `export function evaluateKnowledgeAnswer(a: { answer: string }) { return { answer: a.answer, policyFlags: [] as string[] }; }`
> `repository.ts` → `export type KnowledgeRepository = { list: () => Promise<never>; getById: () => Promise<never> };`
> `mock-repository.ts` → `export const mockKnowledgeSources = [] as const; export function createMockKnowledgeRepository() { return { async list() { throw new Error("stub"); }, async getById() { throw new Error("stub"); } }; }`
> These stubs are replaced with real implementations in Tasks 4–6.

- [ ] **Step 6: Commit**

```bash
git add packages/domain/src/knowledge packages/domain/tests/knowledge.test.ts packages/domain/src/index.ts packages/domain/package.json
git commit -m "feat(domain): knowledge schemas, types, module barrel"
```

---

### Task 4: Read-only repository + mock

**Files:**
- Modify: `packages/domain/src/knowledge/repository.ts`, `mock-repository.ts`
- Modify: `packages/domain/tests/knowledge.test.ts` (add repository describe block)

**Interfaces:**
- Produces: `KnowledgeRepository = { list(query?): Promise<KnowledgeSourceListResult>; getById(id): Promise<KnowledgeSource | null> }`; `createMockKnowledgeRepository(seed?)`; `mockKnowledgeSources`.
- Consumes: `applyCatalogPagination`, `includesCatalogSearch` from `../catalog/mock-utils`.

- [ ] **Step 1: Add the failing repository test**

```ts
// append to packages/domain/tests/knowledge.test.ts
import { createMockKnowledgeRepository } from "../src/knowledge";

describe("createMockKnowledgeRepository", () => {
  it("exposes only list and getById", () => {
    const repo = createMockKnowledgeRepository();
    expect(Object.keys(repo).sort()).toEqual(["getById", "list"]);
  });
  it("returns seeded sources and finds by id", async () => {
    const repo = createMockKnowledgeRepository();
    const result = await repo.list();
    expect(result.items.length).toBeGreaterThan(0);
    const first = result.items[0];
    expect(await repo.getById(first.id)).not.toBeNull();
    expect(await repo.getById("00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `corepack pnpm --filter @hom/domain test -- knowledge`
Expected: FAIL (`list` throws "stub").

- [ ] **Step 3: Implement repository.ts + mock-repository.ts**

```ts
// packages/domain/src/knowledge/repository.ts
import type { KnowledgeSource, KnowledgeSourceListResult } from "./types";

export type KnowledgeSourceListQuery = { search?: string; page?: number; pageSize?: number };

export type KnowledgeRepository = {
  list(query?: KnowledgeSourceListQuery): Promise<KnowledgeSourceListResult>;
  getById(id: string): Promise<KnowledgeSource | null>;
};
```

```ts
// packages/domain/src/knowledge/mock-repository.ts
import { applyCatalogPagination, includesCatalogSearch } from "../catalog/mock-utils";
import type { KnowledgeRepository, KnowledgeSourceListQuery } from "./repository";
import { knowledgeSourceListResultSchema, knowledgeSourceSchema } from "./schemas";
import type { KnowledgeSource } from "./types";

export const mockKnowledgeSources = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Pricing Sheet 2026",
    docType: "pricing",
    scopes: ["public_chatbot"],
    status: "published",
    version: 1,
    confidence: 0.92,
    extractedText: "Private session Rp 550.000. Monthly unlimited Rp 3.500.000.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Cancellation SOP",
    docType: "sop",
    scopes: ["internal_admin"],
    status: "extracted",
    version: 1,
    confidence: 0.81,
    extractedText: "Cancellations under 24 hours forfeit the session.",
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
] as const satisfies readonly KnowledgeSource[];

export function createMockKnowledgeRepository(
  seed: readonly KnowledgeSource[] = mockKnowledgeSources,
): KnowledgeRepository {
  const sources = seed.map((s) => knowledgeSourceSchema.parse(s));
  return {
    async list(query: KnowledgeSourceListQuery = {}) {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const filtered = sources.filter((s) =>
        query.search ? includesCatalogSearch(query.search, [s.title, s.docType]) : true,
      );
      return knowledgeSourceListResultSchema.parse({
        items: applyCatalogPagination(filtered, { page, pageSize }),
        total: filtered.length,
        page,
        pageSize,
      });
    },
    async getById(id: string) {
      return sources.find((s) => s.id === id) ?? null;
    },
  };
}
```

> Verify `includesCatalogSearch` signature against `packages/domain/src/catalog/mock-utils.ts` before finalizing (it may take `(search, fields[])` or `(field, search)`); adapt the call to match exactly.

- [ ] **Step 4: Run to verify pass**

Run: `corepack pnpm --filter @hom/domain test -- knowledge`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/knowledge/repository.ts packages/domain/src/knowledge/mock-repository.ts packages/domain/tests/knowledge.test.ts
git commit -m "feat(domain): knowledge read-only repository + mock"
```

---

### Task 5: Chunker

**Files:**
- Modify: `packages/domain/src/knowledge/chunk.ts`
- Modify: `packages/domain/tests/knowledge.test.ts`

**Interfaces:**
- Produces: `chunkText(text: string, opts?: { maxChars?: number; overlap?: number }): string[]`.

- [ ] **Step 1: Failing test**

```ts
// append to packages/domain/tests/knowledge.test.ts
import { chunkText } from "../src/knowledge";

describe("chunkText", () => {
  it("returns one chunk for short text", () => {
    expect(chunkText("hello world")).toEqual(["hello world"]);
  });
  it("splits long text into overlapping chunks", () => {
    const text = "a".repeat(2500);
    const chunks = chunkText(text, { maxChars: 1000, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((c) => c.length <= 1000)).toBe(true);
  });
  it("ignores empty input", () => {
    expect(chunkText("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `corepack pnpm --filter @hom/domain test -- knowledge` → FAIL.

- [ ] **Step 3: Implement chunk.ts**

```ts
// packages/domain/src/knowledge/chunk.ts
export function chunkText(
  text: string,
  opts: { maxChars?: number; overlap?: number } = {},
): string[] {
  const maxChars = opts.maxChars ?? 2000;
  const overlap = Math.min(opts.overlap ?? 200, Math.floor(maxChars / 2));
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end === normalized.length) break;
    start = end - overlap;
  }
  return chunks;
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/knowledge/chunk.ts packages/domain/tests/knowledge.test.ts
git commit -m "feat(domain): knowledge text chunker"
```

---

### Task 6: Policy guard

**Files:**
- Modify: `packages/domain/src/knowledge/policy-guard.ts`
- Modify: `packages/domain/tests/knowledge.test.ts`

**Interfaces:**
- Produces: `evaluateKnowledgeAnswer(input: { answer: string; hasSources: boolean }): { answer: string; policyFlags: string[] }`. Enforces `docs/06` §8: blocks medical diagnosis, healing/refund promises, unapproved discounts, reschedule confirmations; if no sources, replaces the answer with a safe fallback.

- [ ] **Step 1: Failing test**

```ts
// append to packages/domain/tests/knowledge.test.ts
import { evaluateKnowledgeAnswer } from "../src/knowledge";

describe("evaluateKnowledgeAnswer", () => {
  it("passes a grounded neutral answer", () => {
    const r = evaluateKnowledgeAnswer({ answer: "Harga private session Rp 550.000.", hasSources: true });
    expect(r.policyFlags).toEqual([]);
    expect(r.answer).toContain("550.000");
  });
  it("flags a refund promise", () => {
    const r = evaluateKnowledgeAnswer({ answer: "Kami pasti akan refund penuh.", hasSources: true });
    expect(r.policyFlags).toContain("refund_promise");
  });
  it("returns a safe fallback when there are no sources", () => {
    const r = evaluateKnowledgeAnswer({ answer: "anything", hasSources: false });
    expect(r.policyFlags).toContain("no_sources");
    expect(r.answer.toLowerCase()).toContain("belum ada");
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement policy-guard.ts**

```ts
// packages/domain/src/knowledge/policy-guard.ts
const RULES: { flag: string; pattern: RegExp }[] = [
  { flag: "medical_diagnosis", pattern: /\b(diagnos|you have|anda menderita|pasti (sakit|cedera))\b/i },
  { flag: "healing_promise", pattern: /\b(pasti sembuh|guaranteed cure|dijamin sembuh)\b/i },
  { flag: "refund_promise", pattern: /\b(pasti .*refund|refund penuh|guaranteed refund)\b/i },
  { flag: "unapproved_discount", pattern: /\b(diskon khusus|special discount|potongan .*%)\b/i },
  { flag: "reschedule_confirmation", pattern: /\b(sudah saya reschedule|reschedule confirmed|jadwal (sudah )?diubah)\b/i },
];

const SAFE_FALLBACK =
  "Maaf, belum ada informasi yang cukup di knowledge base untuk menjawab ini. Silakan tambahkan dokumen terkait atau eskalasi ke tim.";

export function evaluateKnowledgeAnswer(input: {
  answer: string;
  hasSources: boolean;
}): { answer: string; policyFlags: string[] } {
  if (!input.hasSources) {
    return { answer: SAFE_FALLBACK, policyFlags: ["no_sources"] };
  }
  const policyFlags = RULES.filter((r) => r.pattern.test(input.answer)).map((r) => r.flag);
  if (policyFlags.length > 0) {
    return {
      answer:
        "Jawaban ditahan karena melanggar kebijakan (tidak boleh mendiagnosis, menjanjikan refund/kesembuhan, atau mengonfirmasi reschedule). Silakan tinjau manual.",
      policyFlags,
    };
  }
  return { answer: input.answer, policyFlags };
}
```

- [ ] **Step 4: Run to verify pass** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/knowledge/policy-guard.ts packages/domain/tests/knowledge.test.ts
git commit -m "feat(domain): knowledge answer policy guard"
```

---

## Phase 3 — AI Gateway (`apps/web/src/lib/ai/gateway`)

### Task 7: Add dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install**

Run:
```bash
corepack pnpm --dir apps/web add openai@^4 xlsx@^0.18.5 unpdf@^0.12.1
```
(Confirm resolved versions; `openai` v4 is the stable SDK. `unpdf` is serverless-safe pdf text extraction.)

- [ ] **Step 2: Verify typecheck still passes** — `corepack pnpm --dir apps/web typecheck` → PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add openai, xlsx, unpdf deps for knowledge ingestion"
```

---

### Task 8: Gateway config + mock adapter

**Files:**
- Create: `apps/web/src/lib/ai/gateway/config.ts`, `mock-adapter.ts`, `types.ts`
- Create: `apps/web/tests/unit/ai-gateway.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `EmbeddingVector = number[]`; `GatewayMode = "openai" | "mock"`.
  - `config.ts`: `getOpenAiApiKey(): string | null`; `getGatewayMode(): GatewayMode`; `MODEL_ALIASES = { embedding: "text-embedding-3-small", vision: "gpt-4o-mini", answer: "gpt-4o-mini" }`.
  - `mock-adapter.ts`: `mockEmbed(text: string): EmbeddingVector` (deterministic, length 1536); `mockVisionExtract(fileName: string): string`; `mockAnswer(question: string, contexts: string[]): string`.

- [ ] **Step 1: Failing test**

```ts
// apps/web/tests/unit/ai-gateway.test.ts
import { describe, expect, it } from "vitest";
import { mockEmbed } from "@/lib/ai/gateway/mock-adapter";

describe("mockEmbed", () => {
  it("returns a 1536-dim vector", () => {
    expect(mockEmbed("hello")).toHaveLength(1536);
  });
  it("is deterministic for the same input", () => {
    expect(mockEmbed("hello")).toEqual(mockEmbed("hello"));
  });
  it("differs for different input", () => {
    expect(mockEmbed("hello")).not.toEqual(mockEmbed("world"));
  });
});
```

- [ ] **Step 2: Run to verify fail** — `corepack pnpm --dir apps/web test -- ai-gateway` → FAIL.

- [ ] **Step 3: Implement types.ts, config.ts, mock-adapter.ts**

```ts
// apps/web/src/lib/ai/gateway/types.ts
export type EmbeddingVector = number[];
export type GatewayMode = "openai" | "mock";
export const EMBEDDING_DIM = 1536;
```

```ts
// apps/web/src/lib/ai/gateway/config.ts
import "server-only";
import type { GatewayMode } from "./types";

function readTrimmedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}
export function getOpenAiApiKey(): string | null {
  return readTrimmedEnv("OPENAI_API_KEY");
}
export function getGatewayMode(): GatewayMode {
  return getOpenAiApiKey() ? "openai" : "mock";
}
export const MODEL_ALIASES = {
  embedding: "text-embedding-3-small",
  vision: "gpt-4o-mini",
  answer: "gpt-4o-mini",
} as const;
```

```ts
// apps/web/src/lib/ai/gateway/mock-adapter.ts
import { EMBEDDING_DIM, type EmbeddingVector } from "./types";

// Deterministic hash-based pseudo-embedding: stable across runs, offline-safe.
export function mockEmbed(text: string): EmbeddingVector {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vec[(code + i) % EMBEDDING_DIM] += ((code % 17) + 1) / 17;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
export function mockVisionExtract(fileName: string): string {
  return `[mock vision extraction for ${fileName}] (set OPENAI_API_KEY to enable real OCR)`;
}
export function mockAnswer(question: string, contexts: string[]): string {
  const snippet = contexts[0]?.slice(0, 160) ?? "(tidak ada konteks)";
  return `[demo] Berdasarkan sumber: "${snippet}". (Pertanyaan: ${question})`;
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/ai/gateway/config.ts apps/web/src/lib/ai/gateway/mock-adapter.ts apps/web/src/lib/ai/gateway/types.ts apps/web/tests/unit/ai-gateway.test.ts
git commit -m "feat(web): AI gateway config + deterministic mock adapter"
```

---

### Task 9: OpenAI adapter + gateway facade

**Files:**
- Create: `apps/web/src/lib/ai/gateway/openai-adapter.ts`, `index.ts`
- Create: `apps/web/tests/unit/ai-gateway-facade.test.ts`

**Interfaces:**
- Produces (`index.ts`, the only surface callers import):
  - `embedText(text: string): Promise<EmbeddingVector>`
  - `embedTexts(texts: string[]): Promise<EmbeddingVector[]>`
  - `extractImageText(input: { base64: string; mimeType: string; fileName: string }): Promise<string>`
  - `answerFromContext(input: { question: string; contexts: string[] }): Promise<string>`
  - Each dispatches on `getGatewayMode()` → OpenAI adapter or mock. Adapters are `server-only`, 20s timeout, no logging.

- [ ] **Step 1: Failing test (mock-mode path, no key)**

```ts
// apps/web/tests/unit/ai-gateway-facade.test.ts
import { describe, expect, it, beforeEach } from "vitest";

describe("gateway facade in mock mode", () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });
  it("embeds via mock when no key", async () => {
    const { embedText } = await import("@/lib/ai/gateway");
    expect(await embedText("hi")).toHaveLength(1536);
  });
  it("answers via mock when no key", async () => {
    const { answerFromContext } = await import("@/lib/ai/gateway");
    const a = await answerFromContext({ question: "q", contexts: ["ctx"] });
    expect(a).toContain("[demo]");
  });
});
```

- [ ] **Step 2: Run to verify fail** — FAIL (no `@/lib/ai/gateway` index).

- [ ] **Step 3: Implement openai-adapter.ts + index.ts**

```ts
// apps/web/src/lib/ai/gateway/openai-adapter.ts
import "server-only";
import OpenAI from "openai";
import { MODEL_ALIASES } from "./config";
import type { EmbeddingVector } from "./types";

const TIMEOUT_MS = 20_000;
export class GatewayError extends Error {}

function client(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
}

export async function openAiEmbed(apiKey: string, texts: string[]): Promise<EmbeddingVector[]> {
  try {
    const res = await client(apiKey).embeddings.create({
      model: MODEL_ALIASES.embedding,
      input: texts,
    });
    return res.data.map((d) => d.embedding as number[]);
  } catch {
    throw new GatewayError("Embedding request failed.");
  }
}

export async function openAiExtractImage(
  apiKey: string,
  input: { base64: string; mimeType: string },
): Promise<string> {
  try {
    const res = await client(apiKey).chat.completions.create({
      model: MODEL_ALIASES.vision,
      max_tokens: 1500,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract ALL readable text from this document image verbatim. If it is a table, keep rows. Add a one-line description at the end prefixed 'DESCRIPTION:'. Do not invent content.",
            },
            { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${input.base64}` } },
          ],
        },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") throw new GatewayError("Empty vision result.");
    return content;
  } catch {
    throw new GatewayError("Image extraction failed.");
  }
}

export async function openAiAnswer(
  apiKey: string,
  input: { question: string; contexts: string[] },
): Promise<string> {
  const context = input.contexts.map((c, i) => `[${i + 1}] ${c}`).join("\n\n");
  try {
    const res = await client(apiKey).chat.completions.create({
      model: MODEL_ALIASES.answer,
      max_tokens: 600,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Answer ONLY from the provided context. If the context is insufficient, say you don't have enough information. Never diagnose, never promise refunds/healing/discounts, never confirm reschedules. Cite sources as [n].",
        },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${input.question}` },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") throw new GatewayError("Empty answer.");
    return content;
  } catch {
    throw new GatewayError("Answer generation failed.");
  }
}
```

```ts
// apps/web/src/lib/ai/gateway/index.ts
import "server-only";
import { getGatewayMode, getOpenAiApiKey } from "./config";
import { mockAnswer, mockEmbed, mockVisionExtract } from "./mock-adapter";
import { openAiAnswer, openAiEmbed, openAiExtractImage } from "./openai-adapter";
import type { EmbeddingVector } from "./types";

export type { EmbeddingVector } from "./types";
export { GatewayError } from "./openai-adapter";
export { getGatewayMode } from "./config";

export async function embedTexts(texts: string[]): Promise<EmbeddingVector[]> {
  if (texts.length === 0) return [];
  if (getGatewayMode() === "mock") return texts.map(mockEmbed);
  return openAiEmbed(getOpenAiApiKey() as string, texts);
}
export async function embedText(text: string): Promise<EmbeddingVector> {
  return (await embedTexts([text]))[0];
}
export async function extractImageText(input: {
  base64: string;
  mimeType: string;
  fileName: string;
}): Promise<string> {
  if (getGatewayMode() === "mock") return mockVisionExtract(input.fileName);
  return openAiExtractImage(getOpenAiApiKey() as string, input);
}
export async function answerFromContext(input: {
  question: string;
  contexts: string[];
}): Promise<string> {
  if (getGatewayMode() === "mock") return mockAnswer(input.question, input.contexts);
  return openAiAnswer(getOpenAiApiKey() as string, input);
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS (mock path).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/ai/gateway/openai-adapter.ts apps/web/src/lib/ai/gateway/index.ts apps/web/tests/unit/ai-gateway-facade.test.ts
git commit -m "feat(web): OpenAI gateway adapter + alias facade"
```

---

## Phase 4 — Extraction + server orchestrators

### Task 10: File extractors

**Files:**
- Create: `apps/web/src/lib/knowledge/extract/spreadsheet.ts`, `pdf.ts`, `image.ts`, `index.ts`
- Create: `apps/web/tests/unit/knowledge-extract.test.ts`

**Interfaces:**
- Produces:
  - `extractSpreadsheet(buffer: ArrayBuffer): { text: string; confidence: number }`
  - `extractPdf(buffer: ArrayBuffer): Promise<{ text: string; confidence: number; needsVision: boolean }>`
  - `extractImage(input: { buffer: ArrayBuffer; mimeType: string; fileName: string }): Promise<{ text: string; confidence: number }>` (delegates to gateway `extractImageText`)
  - `extractByMime(input: { buffer: ArrayBuffer; mimeType: string; fileName: string }): Promise<{ text: string; confidence: number }>` (dispatches by MIME; PDF with `needsVision` renders is out of MVP scope — falls back to whatever text layer exists, flags low confidence).

- [ ] **Step 1: Failing test (spreadsheet + dispatch; pure, no network)**

```ts
// apps/web/tests/unit/knowledge-extract.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { extractSpreadsheet } from "@/lib/knowledge/extract/spreadsheet";

function makeXlsx(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([["Service", "Price"], ["Private", 550000]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("extractSpreadsheet", () => {
  it("extracts header + row text", () => {
    const { text, confidence } = extractSpreadsheet(makeXlsx());
    expect(text).toContain("Service");
    expect(text).toContain("550000");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("extractByMime image path (mock gateway)", () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });
  it("uses vision extraction for images", async () => {
    const { extractByMime } = await import("@/lib/knowledge/extract");
    const r = await extractByMime({ buffer: new ArrayBuffer(4), mimeType: "image/png", fileName: "a.png" });
    expect(r.text).toContain("mock vision extraction");
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement extractors**

```ts
// apps/web/src/lib/knowledge/extract/spreadsheet.ts
import "server-only";
import * as XLSX from "xlsx";

export function extractSpreadsheet(buffer: ArrayBuffer): { text: string; confidence: number } {
  const wb = XLSX.read(buffer, { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
    if (rows.length === 0) continue;
    const [header, ...body] = rows;
    parts.push(`# Sheet: ${name}`);
    for (const row of body) {
      const line = row
        .map((cell, i) => `${header?.[i] ?? `col${i}`}: ${cell ?? ""}`)
        .join(" | ");
      if (line.trim()) parts.push(line);
    }
  }
  const text = parts.join("\n");
  return { text, confidence: text.length > 0 ? 0.95 : 0 };
}
```

```ts
// apps/web/src/lib/knowledge/extract/pdf.ts
import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdf(
  buffer: ArrayBuffer,
): Promise<{ text: string; confidence: number; needsVision: boolean }> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = (Array.isArray(text) ? text.join("\n") : text).trim();
  const needsVision = clean.length < 20; // scanned PDF: little/no text layer
  return { text: clean, confidence: needsVision ? 0.2 : 0.85, needsVision };
}
```

```ts
// apps/web/src/lib/knowledge/extract/image.ts
import "server-only";
import { extractImageText } from "@/lib/ai/gateway";

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}
export async function extractImage(input: {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
}): Promise<{ text: string; confidence: number }> {
  const text = await extractImageText({
    base64: toBase64(input.buffer),
    mimeType: input.mimeType,
    fileName: input.fileName,
  });
  return { text, confidence: text.startsWith("[mock") ? 0.3 : 0.75 };
}
```

```ts
// apps/web/src/lib/knowledge/extract/index.ts
import "server-only";
import { extractImage } from "./image";
import { extractPdf } from "./pdf";
import { extractSpreadsheet } from "./spreadsheet";

export { extractImage, extractPdf, extractSpreadsheet };

export const SUPPORTED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export async function extractByMime(input: {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
}): Promise<{ text: string; confidence: number }> {
  const m = input.mimeType;
  if (m.includes("spreadsheet") || m.includes("ms-excel") || m === "text/csv") {
    return extractSpreadsheet(input.buffer);
  }
  if (m === "application/pdf") {
    const { text, confidence } = await extractPdf(input.buffer);
    return { text, confidence };
  }
  if (m === "image/png" || m === "image/jpeg") {
    return extractImage(input);
  }
  throw new Error("UNSUPPORTED_MIME");
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/knowledge/extract apps/web/tests/unit/knowledge-extract.test.ts
git commit -m "feat(web): knowledge file extractors (xlsx, pdf, image)"
```

---

### Task 11: Supabase repository + factory + RPC boundary

**Files:**
- Create: `apps/web/src/lib/knowledge/supabase/knowledge-repository.ts`
- Create: `apps/web/src/lib/knowledge/repository-factory.ts`
- Create: `apps/web/src/lib/knowledge/server/knowledge-rpcs.ts`
- Create: `apps/web/tests/unit/knowledge-repository-factory.test.ts`

**Interfaces:**
- Produces:
  - `createKnowledgeRepositories(): { knowledge: KnowledgeRepository }` — returns mock repos unless `getDataMode() === "supabase"`.
  - `knowledge-rpcs.ts` (server-only): `rpcCreateSource(...)`, `rpcSetExtracted(...)`, `rpcFail(...)`, `rpcPublish(...)`, `rpcMatch(...)` — thin wrappers calling `createSupabaseServerClient().rpc(...)`, mapping the returned row(s) through `knowledgeSourceSchema` and mapping RPC errors to a `KnowledgeRpcError` with a code union (`AUTH_REQUIRED | APP_USER_REQUIRED | PERMISSION_DENIED | SOURCE_NOT_FOUND | KNOWLEDGE_RPC_FAILED`).

- [ ] **Step 1: Failing test (factory returns mock in mock mode)**

```ts
// apps/web/tests/unit/knowledge-repository-factory.test.ts
import { describe, expect, it, beforeEach } from "vitest";

describe("createKnowledgeRepositories", () => {
  beforeEach(() => { process.env.HOM_DATA_MODE = "mock"; });
  it("returns a working mock repository", async () => {
    const { createKnowledgeRepositories } = await import("@/lib/knowledge/repository-factory");
    const { knowledge } = createKnowledgeRepositories();
    const result = await knowledge.list();
    expect(result.items.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement factory + supabase repo + rpc boundary**

```ts
// apps/web/src/lib/knowledge/supabase/knowledge-repository.ts
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { knowledgeSourceListResultSchema, knowledgeSourceSchema } from "@hom/domain/knowledge";
import type { KnowledgeRepository, KnowledgeSourceListQuery } from "@hom/domain/knowledge";

function mapRow(row: Record<string, unknown>) {
  return knowledgeSourceSchema.parse({
    id: row.id,
    title: row.title,
    docType: row.doc_type,
    scopes: row.scopes,
    status: row.status,
    version: row.version,
    confidence: row.confidence,
    extractedText: row.extracted_text ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function createSupabaseKnowledgeRepository(client: SupabaseClient): KnowledgeRepository {
  return {
    async list(query: KnowledgeSourceListQuery = {}) {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { data, error, count } = await client
        .from("knowledge_sources")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw error;
      return knowledgeSourceListResultSchema.parse({
        items: (data ?? []).map(mapRow),
        total: count ?? 0,
        page,
        pageSize,
      });
    },
    async getById(id: string) {
      const { data, error } = await client.from("knowledge_sources").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
  };
}
```

```ts
// apps/web/src/lib/knowledge/repository-factory.ts
import "server-only";
import { createMockKnowledgeRepository, type KnowledgeRepository } from "@hom/domain/knowledge";
import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseKnowledgeRepository } from "./supabase/knowledge-repository";

export function createKnowledgeRepositories(): { knowledge: KnowledgeRepository } {
  if (getDataMode() !== "supabase") {
    return { knowledge: createMockKnowledgeRepository() };
  }
  const client = createSupabaseServerClient();
  return { knowledge: createSupabaseKnowledgeRepository(client) };
}
```

```ts
// apps/web/src/lib/knowledge/server/knowledge-rpcs.ts
import "server-only";
import { knowledgeSourceSchema } from "@hom/domain/knowledge";
import type { KnowledgeSource } from "@hom/domain/knowledge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const KNOWN = ["AUTH_REQUIRED", "APP_USER_REQUIRED", "PERMISSION_DENIED", "SOURCE_NOT_FOUND", "CHUNKS_REQUIRED"] as const;
export type KnowledgeRpcCode = (typeof KNOWN)[number] | "KNOWLEDGE_RPC_FAILED";
export class KnowledgeRpcError extends Error {
  constructor(readonly code: KnowledgeRpcCode) { super(code); }
  static from(message: string | undefined): KnowledgeRpcError {
    const hit = KNOWN.find((c) => (message ?? "").includes(c));
    return new KnowledgeRpcError(hit ?? "KNOWLEDGE_RPC_FAILED");
  }
}

function mapRow(row: Record<string, unknown>): KnowledgeSource {
  return knowledgeSourceSchema.parse({
    id: row.id, title: row.title, docType: row.doc_type, scopes: row.scopes,
    status: row.status, version: row.version, confidence: row.confidence,
    extractedText: row.extracted_text ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
  });
}

export async function rpcCreateSource(args: {
  title: string; docType: string; scopes: string[]; storagePath: string; mimeType: string; fileSize: number; checksum: string | null;
}): Promise<KnowledgeSource> {
  const { data, error } = await createSupabaseServerClient().rpc("create_knowledge_source", {
    p_title: args.title, p_doc_type: args.docType, p_scopes: args.scopes, p_storage_path: args.storagePath,
    p_mime_type: args.mimeType, p_file_size: args.fileSize, p_checksum: args.checksum,
  });
  if (error) throw KnowledgeRpcError.from(error.message);
  return mapRow((data as Record<string, unknown>[])[0]);
}

export async function rpcSetExtracted(args: { id: string; text: string; confidence: number }): Promise<KnowledgeSource> {
  const { data, error } = await createSupabaseServerClient().rpc("set_knowledge_source_extracted", {
    p_id: args.id, p_extracted_text: args.text, p_confidence: args.confidence,
  });
  if (error) throw KnowledgeRpcError.from(error.message);
  return mapRow((data as Record<string, unknown>[])[0]);
}

export async function rpcFail(args: { id: string; error: string }): Promise<void> {
  const { error } = await createSupabaseServerClient().rpc("fail_knowledge_source", { p_id: args.id, p_error: args.error });
  if (error) throw KnowledgeRpcError.from(error.message);
}

export async function rpcPublish(args: {
  id: string; text: string; chunks: { index: number; content: string; embedding: number[]; tokenCount: number }[];
}): Promise<KnowledgeSource> {
  const { data, error } = await createSupabaseServerClient().rpc("publish_knowledge_source", {
    p_id: args.id, p_extracted_text: args.text, p_chunks: args.chunks,
  });
  if (error) throw KnowledgeRpcError.from(error.message);
  return mapRow((data as Record<string, unknown>[])[0]);
}

export async function rpcMatch(args: { embedding: number[]; scopes: string[]; matchCount: number }): Promise<
  { sourceId: string; sourceTitle: string; chunkIndex: number; content: string; distance: number }[]
> {
  const { data, error } = await createSupabaseServerClient().rpc("match_knowledge_chunks", {
    p_query_embedding: args.embedding, p_scopes: args.scopes, p_match_count: args.matchCount,
  });
  if (error) throw KnowledgeRpcError.from(error.message);
  return (data as Record<string, unknown>[]).map((r) => ({
    sourceId: String(r.source_id), sourceTitle: String(r.source_title),
    chunkIndex: Number(r.chunk_index), content: String(r.content), distance: Number(r.distance),
  }));
}
```

> Note: pgvector params sent as `number[]` are accepted by PostgREST when the column/param is `vector`; if the RPC rejects the array, stringify as `"[a,b,...]"`. Verify in Task 13 Step 2 and adapt.

- [ ] **Step 4: Run to verify pass** — `corepack pnpm --dir apps/web test -- knowledge-repository-factory` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/knowledge/supabase apps/web/src/lib/knowledge/repository-factory.ts apps/web/src/lib/knowledge/server/knowledge-rpcs.ts apps/web/tests/unit/knowledge-repository-factory.test.ts
git commit -m "feat(web): knowledge supabase repository, factory, and RPC boundary"
```

---

### Task 12: Upload+extract orchestrator + action

**Files:**
- Create: `apps/web/src/lib/knowledge/server/submit-upload-knowledge-source.ts`
- Create: `apps/web/src/features/knowledge-studio/upload-knowledge-action.ts`
- Create: `apps/web/src/features/knowledge-studio/knowledge-action-types.ts`
- Create: `apps/web/tests/unit/submit-upload-knowledge-source.test.ts`

**Interfaces:**
- Consumes: `createKnowledgeSourceInputSchema` (@hom/domain/knowledge), `extractByMime`, `SUPPORTED_MIME`, `rpcCreateSource`/`rpcSetExtracted`/`rpcFail`, `getDataMode`/`getAuthMode`, `getCurrentUser`, `createSupabaseServerClient` (storage upload).
- Produces: `submitUploadKnowledgeSource(formData: FormData): Promise<KnowledgeUploadState>` where `KnowledgeUploadState = { status: "idle" } | { status: "configuration_error"|"auth_required"|"permission_denied"|"validation_error"|"unsupported_file"|"error"; message: string } | { status: "success"; sourceId: string; title: string; extractedText: string; confidence: number; mode: "openai"|"mock" }`.

- [ ] **Step 1: Failing test (mock data mode → configuration_error)**

```ts
// apps/web/tests/unit/submit-upload-knowledge-source.test.ts
import { describe, expect, it, beforeEach } from "vitest";

describe("submitUploadKnowledgeSource", () => {
  beforeEach(() => { process.env.HOM_DATA_MODE = "mock"; process.env.HOM_AUTH_MODE = "mock"; });
  it("refuses in mock mode", async () => {
    const { submitUploadKnowledgeSource } = await import("@/lib/knowledge/server/submit-upload-knowledge-source");
    const fd = new FormData();
    fd.set("title", "x"); fd.set("docType", "pricing"); fd.set("scopes", "public_chatbot");
    fd.set("file", new File([new Uint8Array([1])], "x.png", { type: "image/png" }));
    const state = await submitUploadKnowledgeSource(fd);
    expect(state.status).toBe("configuration_error");
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement orchestrator + action + types**

```ts
// apps/web/src/features/knowledge-studio/knowledge-action-types.ts
export type KnowledgeUploadState =
  | { status: "idle" }
  | { status: "configuration_error" | "auth_required" | "permission_denied" | "validation_error" | "unsupported_file" | "error"; message: string }
  | { status: "success"; sourceId: string; title: string; extractedText: string; confidence: number; mode: "openai" | "mock" };

export const initialKnowledgeUploadState: KnowledgeUploadState = { status: "idle" };
```

```ts
// apps/web/src/lib/knowledge/server/submit-upload-knowledge-source.ts
import "server-only";
import { z } from "zod";
import { createKnowledgeSourceInputSchema } from "@hom/domain/knowledge";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGatewayMode } from "@/lib/ai/gateway";
import { extractByMime, SUPPORTED_MIME } from "@/lib/knowledge/extract";
import { rpcCreateSource, rpcFail, rpcSetExtracted, KnowledgeRpcError } from "./knowledge-rpcs";
import type { KnowledgeUploadState } from "@/features/knowledge-studio/knowledge-action-types";

const MAX_BYTES = 15 * 1024 * 1024;
const formSchema = z.object({
  title: z.string().trim().min(1).max(160),
  docType: z.string().trim().min(1).max(60),
  scopes: z.array(z.string()).min(1),
}).strict();

export async function submitUploadKnowledgeSource(formData: FormData): Promise<KnowledgeUploadState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return { status: "configuration_error", message: "Upload tidak tersedia di mode mock/preview." };
  }
  let user = null;
  try { user = await getCurrentUser(); } catch { return { status: "auth_required", message: "Silakan login ulang." }; }
  if (!user) return { status: "auth_required", message: "Silakan login ulang." };
  if (!user.permissions.includes("can_manage_knowledge")) {
    return { status: "permission_denied", message: "Anda tidak punya akses mengelola knowledge." };
  }

  const file = formData.get("file");
  const scopesRaw = formData.getAll("scopes").map(String);
  let parsed: z.infer<typeof formSchema>;
  try {
    parsed = formSchema.parse({
      title: String(formData.get("title") ?? ""),
      docType: String(formData.get("docType") ?? ""),
      scopes: scopesRaw,
    });
    createKnowledgeSourceInputSchema.parse(parsed); // domain-level validation (scope enum)
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "validation_error", message: "Periksa judul, tipe, dan scope." };
    throw e;
  }
  if (!(file instanceof File)) return { status: "validation_error", message: "File wajib diunggah." };
  if (file.size === 0 || file.size > MAX_BYTES) return { status: "validation_error", message: "Ukuran file 1 byte–15 MB." };
  if (!SUPPORTED_MIME.has(file.type)) return { status: "unsupported_file", message: "Tipe file tidak didukung." };

  const buffer = await file.arrayBuffer();
  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const supabase = createSupabaseServerClient();
  const upload = await supabase.storage.from("knowledge-sources").upload(storagePath, buffer, {
    contentType: file.type, upsert: false,
  });
  if (upload.error) return { status: "error", message: "Gagal menyimpan file." };

  let sourceId = "";
  try {
    const created = await rpcCreateSource({
      title: parsed.title, docType: parsed.docType, scopes: parsed.scopes,
      storagePath, mimeType: file.type, fileSize: file.size, checksum: null,
    });
    sourceId = created.id;
    const { text, confidence } = await extractByMime({ buffer, mimeType: file.type, fileName: file.name });
    const extracted = await rpcSetExtracted({ id: sourceId, text, confidence });
    return {
      status: "success", sourceId, title: extracted.title,
      extractedText: extracted.extractedText ?? "", confidence: extracted.confidence ?? 0,
      mode: getGatewayMode(),
    };
  } catch (e) {
    if (sourceId) { try { await rpcFail({ id: sourceId, error: "extraction_failed" }); } catch { /* ignore */ } }
    if (e instanceof KnowledgeRpcError && e.code === "PERMISSION_DENIED") {
      return { status: "permission_denied", message: "Akses ditolak oleh server." };
    }
    return { status: "error", message: "Gagal memproses dokumen." };
  }
}
```

```ts
// apps/web/src/features/knowledge-studio/upload-knowledge-action.ts
"use server";
import { submitUploadKnowledgeSource } from "@/lib/knowledge/server/submit-upload-knowledge-source";
import type { KnowledgeUploadState } from "./knowledge-action-types";

export async function uploadKnowledgeAction(
  _prev: KnowledgeUploadState,
  formData: FormData,
): Promise<KnowledgeUploadState> {
  return submitUploadKnowledgeSource(formData);
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS (configuration_error).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/knowledge/server/submit-upload-knowledge-source.ts apps/web/src/features/knowledge-studio/upload-knowledge-action.ts apps/web/src/features/knowledge-studio/knowledge-action-types.ts apps/web/tests/unit/submit-upload-knowledge-source.test.ts
git commit -m "feat(web): upload+extract knowledge orchestrator and action"
```

---

### Task 13: Publish orchestrator + action

**Files:**
- Create: `apps/web/src/lib/knowledge/server/submit-publish-knowledge-source.ts`
- Create: `apps/web/src/features/knowledge-studio/publish-knowledge-action.ts`
- Modify: `apps/web/src/features/knowledge-studio/knowledge-action-types.ts` (add `KnowledgePublishState`)
- Create: `apps/web/tests/unit/submit-publish-knowledge-source.test.ts`

**Interfaces:**
- Consumes: `publishKnowledgeSourceInputSchema`, `chunkText` (@hom/domain/knowledge), `embedTexts` (gateway), `rpcPublish`.
- Produces: `submitPublishKnowledgeSource(formData): Promise<KnowledgePublishState>`; `KnowledgePublishState = {status:"idle"} | {status:"configuration_error"|"auth_required"|"permission_denied"|"validation_error"|"error"; message} | {status:"success"; sourceId: string; chunkCount: number}`.

- [ ] **Step 1: Failing test (permission gate uses can_publish_knowledge; mock mode → configuration_error)**

```ts
// apps/web/tests/unit/submit-publish-knowledge-source.test.ts
import { describe, expect, it, beforeEach } from "vitest";

describe("submitPublishKnowledgeSource", () => {
  beforeEach(() => { process.env.HOM_DATA_MODE = "mock"; process.env.HOM_AUTH_MODE = "mock"; });
  it("refuses in mock mode", async () => {
    const { submitPublishKnowledgeSource } = await import("@/lib/knowledge/server/submit-publish-knowledge-source");
    const fd = new FormData();
    fd.set("sourceId", "11111111-1111-4111-8111-111111111111");
    fd.set("extractedText", "Private session Rp 550.000.");
    const state = await submitPublishKnowledgeSource(fd);
    expect(state.status).toBe("configuration_error");
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement**

```ts
// add to apps/web/src/features/knowledge-studio/knowledge-action-types.ts
export type KnowledgePublishState =
  | { status: "idle" }
  | { status: "configuration_error" | "auth_required" | "permission_denied" | "validation_error" | "error"; message: string }
  | { status: "success"; sourceId: string; chunkCount: number };
export const initialKnowledgePublishState: KnowledgePublishState = { status: "idle" };
```

```ts
// apps/web/src/lib/knowledge/server/submit-publish-knowledge-source.ts
import "server-only";
import { z } from "zod";
import { chunkText, publishKnowledgeSourceInputSchema } from "@hom/domain/knowledge";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { embedTexts } from "@/lib/ai/gateway";
import { rpcPublish, KnowledgeRpcError } from "./knowledge-rpcs";
import type { KnowledgePublishState } from "@/features/knowledge-studio/knowledge-action-types";

export async function submitPublishKnowledgeSource(formData: FormData): Promise<KnowledgePublishState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return { status: "configuration_error", message: "Publish tidak tersedia di mode mock/preview." };
  }
  let user = null;
  try { user = await getCurrentUser(); } catch { return { status: "auth_required", message: "Silakan login ulang." }; }
  if (!user) return { status: "auth_required", message: "Silakan login ulang." };
  if (!user.permissions.includes("can_publish_knowledge")) {
    return { status: "permission_denied", message: "Anda tidak punya akses publish knowledge." };
  }
  let input: z.infer<typeof publishKnowledgeSourceInputSchema>;
  try {
    input = publishKnowledgeSourceInputSchema.parse({
      sourceId: String(formData.get("sourceId") ?? ""),
      extractedText: String(formData.get("extractedText") ?? ""),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "validation_error", message: "Teks atau ID tidak valid." };
    throw e;
  }
  const pieces = chunkText(input.extractedText, { maxChars: 2000, overlap: 200 });
  if (pieces.length === 0) return { status: "validation_error", message: "Tidak ada teks untuk di-embed." };
  try {
    const embeddings = await embedTexts(pieces);
    const chunks = pieces.map((content, index) => ({
      index, content, embedding: embeddings[index], tokenCount: Math.ceil(content.length / 4),
    }));
    const published = await rpcPublish({ id: input.sourceId, text: input.extractedText, chunks });
    return { status: "success", sourceId: published.id, chunkCount: chunks.length };
  } catch (e) {
    if (e instanceof KnowledgeRpcError && e.code === "PERMISSION_DENIED") {
      return { status: "permission_denied", message: "Akses ditolak oleh server." };
    }
    return { status: "error", message: "Gagal mempublikasikan knowledge." };
  }
}
```

```ts
// apps/web/src/features/knowledge-studio/publish-knowledge-action.ts
"use server";
import { submitPublishKnowledgeSource } from "@/lib/knowledge/server/submit-publish-knowledge-source";
import type { KnowledgePublishState } from "./knowledge-action-types";

export async function publishKnowledgeAction(
  _prev: KnowledgePublishState,
  formData: FormData,
): Promise<KnowledgePublishState> {
  return submitPublishKnowledgeSource(formData);
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/knowledge/server/submit-publish-knowledge-source.ts apps/web/src/features/knowledge-studio/publish-knowledge-action.ts apps/web/src/features/knowledge-studio/knowledge-action-types.ts apps/web/tests/unit/submit-publish-knowledge-source.test.ts
git commit -m "feat(web): publish knowledge orchestrator (chunk+embed) and action"
```

---

### Task 14: Test Lab query orchestrator + action

**Files:**
- Create: `apps/web/src/lib/knowledge/server/submit-knowledge-query.ts`
- Create: `apps/web/src/features/knowledge-studio/query-knowledge-action.ts`
- Modify: `apps/web/src/features/knowledge-studio/knowledge-action-types.ts` (add `KnowledgeQueryState`)
- Create: `apps/web/tests/unit/submit-knowledge-query.test.ts`

**Interfaces:**
- Consumes: `knowledgeQueryInputSchema`, `evaluateKnowledgeAnswer` (@hom/domain/knowledge), `embedText`, `answerFromContext` (gateway), `rpcMatch`.
- Produces: `submitKnowledgeQuery(formData): Promise<KnowledgeQueryState>`; `KnowledgeQueryState = {status:"idle"} | {status:"configuration_error"|"auth_required"|"permission_denied"|"validation_error"|"error"; message} | {status:"success"; answer: string; sources: {title:string; snippet:string}[]; policyFlags: string[]; mode:"openai"|"mock"}`.

- [ ] **Step 1: Failing test (mock mode → configuration_error)**

```ts
// apps/web/tests/unit/submit-knowledge-query.test.ts
import { describe, expect, it, beforeEach } from "vitest";

describe("submitKnowledgeQuery", () => {
  beforeEach(() => { process.env.HOM_DATA_MODE = "mock"; process.env.HOM_AUTH_MODE = "mock"; });
  it("refuses in mock mode", async () => {
    const { submitKnowledgeQuery } = await import("@/lib/knowledge/server/submit-knowledge-query");
    const fd = new FormData();
    fd.set("question", "Berapa harga private?"); fd.set("scope", "public_chatbot");
    const state = await submitKnowledgeQuery(fd);
    expect(state.status).toBe("configuration_error");
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement**

```ts
// add to apps/web/src/features/knowledge-studio/knowledge-action-types.ts
export type KnowledgeQueryState =
  | { status: "idle" }
  | { status: "configuration_error" | "auth_required" | "permission_denied" | "validation_error" | "error"; message: string }
  | { status: "success"; answer: string; sources: { title: string; snippet: string }[]; policyFlags: string[]; mode: "openai" | "mock" };
export const initialKnowledgeQueryState: KnowledgeQueryState = { status: "idle" };
```

```ts
// apps/web/src/lib/knowledge/server/submit-knowledge-query.ts
import "server-only";
import { z } from "zod";
import { evaluateKnowledgeAnswer, knowledgeQueryInputSchema } from "@hom/domain/knowledge";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerFromContext, embedText, getGatewayMode } from "@/lib/ai/gateway";
import { rpcMatch } from "./knowledge-rpcs";
import type { KnowledgeQueryState } from "@/features/knowledge-studio/knowledge-action-types";

export async function submitKnowledgeQuery(formData: FormData): Promise<KnowledgeQueryState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return { status: "configuration_error", message: "Test Lab tidak tersedia di mode mock/preview." };
  }
  let user = null;
  try { user = await getCurrentUser(); } catch { return { status: "auth_required", message: "Silakan login ulang." }; }
  if (!user) return { status: "auth_required", message: "Silakan login ulang." };
  if (!user.permissions.includes("can_manage_knowledge")) {
    return { status: "permission_denied", message: "Anda tidak punya akses knowledge." };
  }
  let input: z.infer<typeof knowledgeQueryInputSchema>;
  try {
    input = knowledgeQueryInputSchema.parse({
      question: String(formData.get("question") ?? ""),
      scope: String(formData.get("scope") ?? ""),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "validation_error", message: "Pertanyaan minimal 3 karakter dan scope wajib." };
    throw e;
  }
  try {
    const queryEmbedding = await embedText(input.question);
    const matches = await rpcMatch({ embedding: queryEmbedding, scopes: [input.scope], matchCount: 5 });
    const hasSources = matches.length > 0;
    const rawAnswer = hasSources
      ? await answerFromContext({ question: input.question, contexts: matches.map((m) => m.content) })
      : "";
    const guarded = evaluateKnowledgeAnswer({ answer: rawAnswer, hasSources });
    return {
      status: "success",
      answer: guarded.answer,
      policyFlags: guarded.policyFlags,
      sources: matches.map((m) => ({ title: m.sourceTitle, snippet: m.content.slice(0, 200) })),
      mode: getGatewayMode(),
    };
  } catch {
    return { status: "error", message: "Gagal menjalankan Test Lab." };
  }
}
```

```ts
// apps/web/src/features/knowledge-studio/query-knowledge-action.ts
"use server";
import { submitKnowledgeQuery } from "@/lib/knowledge/server/submit-knowledge-query";
import type { KnowledgeQueryState } from "./knowledge-action-types";

export async function queryKnowledgeAction(
  _prev: KnowledgeQueryState,
  formData: FormData,
): Promise<KnowledgeQueryState> {
  return submitKnowledgeQuery(formData);
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/knowledge/server/submit-knowledge-query.ts apps/web/src/features/knowledge-studio/query-knowledge-action.ts apps/web/src/features/knowledge-studio/knowledge-action-types.ts apps/web/tests/unit/submit-knowledge-query.test.ts
git commit -m "feat(web): knowledge Test Lab query orchestrator and action"
```

---

## Phase 5 — UI (replaces the placeholder)

### Task 15: Page state + loader

**Files:**
- Create: `apps/web/src/features/knowledge-studio/knowledge-studio-page-state.ts`
- Create: `apps/web/src/features/knowledge-studio/knowledge-studio-page-loader.ts`
- Create: `apps/web/tests/unit/knowledge-studio-page-loader.test.ts`

**Interfaces:**
- Produces: `KnowledgeStudioPageState = { source: "mock"|"supabase" } & ({status:"ready"; sources: KnowledgeSourceRow[]} | {status:"empty"} | {status:"permission_denied"} | {status:"configuration_error"} | {status:"error"; message:string})`; `KnowledgeSourceRow = { id; title; docType; scopes: string; status; version }`; `loadKnowledgeStudioPage(canManage: boolean): Promise<KnowledgeStudioPageState>`.

- [ ] **Step 1: Failing test (mock source, empty vs ready)**

```ts
// apps/web/tests/unit/knowledge-studio-page-loader.test.ts
import { describe, expect, it, beforeEach } from "vitest";

describe("loadKnowledgeStudioPage", () => {
  beforeEach(() => { process.env.HOM_DATA_MODE = "mock"; });
  it("returns permission_denied when the user cannot manage", async () => {
    const { loadKnowledgeStudioPage } = await import("@/features/knowledge-studio/knowledge-studio-page-loader");
    expect((await loadKnowledgeStudioPage(false)).status).toBe("permission_denied");
  });
  it("returns ready with mock sources", async () => {
    const { loadKnowledgeStudioPage } = await import("@/features/knowledge-studio/knowledge-studio-page-loader");
    const state = await loadKnowledgeStudioPage(true);
    expect(state.status === "ready" && state.sources.length > 0).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement state + loader**

```ts
// apps/web/src/features/knowledge-studio/knowledge-studio-page-state.ts
import type { KnowledgeSource } from "@hom/domain/knowledge";

export type KnowledgeSourceRow = {
  id: string; title: string; docType: string; scopes: string; status: string; version: number;
};
export type KnowledgeStudioPageState = { source: "mock" | "supabase" } & (
  | { status: "ready"; sources: KnowledgeSourceRow[] }
  | { status: "empty" }
  | { status: "permission_denied" }
  | { status: "configuration_error" }
  | { status: "error"; message: string }
);

export function toKnowledgeSourceRow(s: KnowledgeSource): KnowledgeSourceRow {
  return { id: s.id, title: s.title, docType: s.docType, scopes: s.scopes.join(", "), status: s.status, version: s.version };
}
```

```ts
// apps/web/src/features/knowledge-studio/knowledge-studio-page-loader.ts
import { getDataMode } from "@/lib/env/app-mode";
import { createKnowledgeRepositories } from "@/lib/knowledge/repository-factory";
import { toKnowledgeSourceRow, type KnowledgeStudioPageState } from "./knowledge-studio-page-state";

export async function loadKnowledgeStudioPage(canManage: boolean): Promise<KnowledgeStudioPageState> {
  const source = getDataMode() === "supabase" ? "supabase" : "mock";
  if (!canManage) return { status: "permission_denied", source };
  try {
    const { knowledge } = createKnowledgeRepositories();
    const result = await knowledge.list();
    if (result.total === 0) return { status: "empty", source };
    return { status: "ready", source, sources: result.items.map(toKnowledgeSourceRow) };
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "42501") return { status: "permission_denied", source };
    return { status: "error", source, message: "Gagal memuat knowledge sources." };
  }
}
```

- [ ] **Step 4: Run to verify pass** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/knowledge-studio/knowledge-studio-page-state.ts apps/web/src/features/knowledge-studio/knowledge-studio-page-loader.ts apps/web/tests/unit/knowledge-studio-page-loader.test.ts
git commit -m "feat(web): knowledge studio page state + loader"
```

---

### Task 16: Presentational page + sources table + stories

**Files:**
- Create: `apps/web/src/features/knowledge-studio/knowledge-studio-page.tsx`
- Create: `apps/web/src/features/knowledge-studio/knowledge-sources-table.tsx`
- Create: `apps/web/src/features/knowledge-studio/knowledge-studio-page.stories.tsx`

**Interfaces:**
- Consumes: `KnowledgeStudioPageState`; components `PageHeader`, `DataTable` (or hand-rolled table), `EmptyState`, `ErrorState`, `PermissionDeniedState`, `Badge`.
- Produces: `KnowledgeStudioPage({ state, uploadSlot, testLabSlot }: { state: KnowledgeStudioPageState; uploadSlot: React.ReactNode; testLabSlot: React.ReactNode })` — pure presentational switch on `state.status`.

- [ ] **Step 1: Implement the presentational page + table**

```tsx
// apps/web/src/features/knowledge-studio/knowledge-sources-table.tsx
import { Badge } from "@/components/ui/badge";
import type { KnowledgeSourceRow } from "./knowledge-studio-page-state";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  published: "success", embedded: "info", extracted: "info", processing: "warning",
  uploaded: "neutral", review_needed: "warning", failed: "danger", archived: "neutral",
};

export function KnowledgeSourcesTable({ rows }: { rows: KnowledgeSourceRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-stone-50 text-left text-foreground-muted">
        <tr>
          <th className="px-3 py-2">Title</th><th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Scope</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Version</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t">
            <td className="px-3 py-2 font-medium text-foreground">{r.title}</td>
            <td className="px-3 py-2">{r.docType}</td>
            <td className="px-3 py-2">{r.scopes}</td>
            <td className="px-3 py-2"><Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge></td>
            <td className="px-3 py-2">v{r.version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```tsx
// apps/web/src/features/knowledge-studio/knowledge-studio-page.tsx
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { KnowledgeSourcesTable } from "./knowledge-sources-table";
import type { KnowledgeStudioPageState } from "./knowledge-studio-page-state";

export function KnowledgeStudioPage({
  state, uploadSlot, testLabSlot,
}: { state: KnowledgeStudioPageState; uploadSlot: React.ReactNode; testLabSlot: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI Management" title="Knowledge Studio"
        description="Unggah dokumen (Excel, PDF, gambar) jadi knowledge base yang bisa ditanya." />
      {state.source === "mock" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Mode preview (mock). Upload & Test Lab aktif saat data mode = supabase.
        </div>
      )}
      {state.status === "permission_denied" && <PermissionDeniedState />}
      {state.status === "configuration_error" && (
        <ErrorState message="Konfigurasi Supabase belum aktif untuk knowledge." />
      )}
      {state.status === "error" && <ErrorState message={state.message} />}
      {(state.status === "ready" || state.status === "empty") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard title="Upload Dokumen" description="Excel / CSV / PDF / JPG / PNG">{uploadSlot}</DashboardCard>
          <DashboardCard title="Test Lab" description="Tanya knowledge yang sudah dipublish">{testLabSlot}</DashboardCard>
        </div>
      )}
      {state.status === "ready" && (
        <DashboardCard title="Knowledge Sources"><KnowledgeSourcesTable rows={state.sources} /></DashboardCard>
      )}
      {state.status === "empty" && (
        <DashboardCard title="Knowledge Sources">
          <EmptyState title="Belum ada dokumen" description="Unggah dokumen pertama lewat panel Upload." />
        </DashboardCard>
      )}
    </div>
  );
}
```

> Verify each imported component's exact prop names against its file (`empty-state.tsx`, `error-state.tsx`, `permission-denied-state.tsx`, `dashboard-card.tsx`, `page-header.tsx`, `badge.tsx`) and adapt props to match; the cheat-sheet lists their locations under `apps/web/src/components/`.

- [ ] **Step 2: Add stories (one per state)**

```tsx
// apps/web/src/features/knowledge-studio/knowledge-studio-page.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KnowledgeStudioPage } from "./knowledge-studio-page";
import type { KnowledgeStudioPageState } from "./knowledge-studio-page-state";

const ready: KnowledgeStudioPageState = {
  status: "ready", source: "supabase",
  sources: [
    { id: "1", title: "Pricing Sheet 2026", docType: "pricing", scopes: "public_chatbot", status: "published", version: 1 },
    { id: "2", title: "Cancellation SOP", docType: "sop", scopes: "internal_admin", status: "extracted", version: 1 },
  ],
};
const meta: Meta<typeof KnowledgeStudioPage> = {
  title: "KnowledgeStudio/KnowledgeStudioPage",
  component: KnowledgeStudioPage,
  args: { state: ready, uploadSlot: <div>Upload form</div>, testLabSlot: <div>Test Lab form</div> },
};
export default meta;
type Story = StoryObj<typeof KnowledgeStudioPage>;
export const Ready: Story = {};
export const Empty: Story = { args: { state: { status: "empty", source: "supabase" } } };
export const PermissionDenied: Story = { args: { state: { status: "permission_denied", source: "supabase" } } };
export const ConfigurationError: Story = { args: { state: { status: "configuration_error", source: "mock" } } };
export const GenericError: Story = { args: { state: { status: "error", source: "supabase", message: "Gagal memuat." } } };
```

- [ ] **Step 3: Verify Storybook builds** — `corepack pnpm --dir apps/web build-storybook` → succeeds (or `storybook dev` renders the 5 stories).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/knowledge-studio/knowledge-studio-page.tsx apps/web/src/features/knowledge-studio/knowledge-sources-table.tsx apps/web/src/features/knowledge-studio/knowledge-studio-page.stories.tsx
git commit -m "feat(web): knowledge studio presentational page + table + stories"
```

---

### Task 17: Upload + review client component

**Files:**
- Create: `apps/web/src/features/knowledge-studio/knowledge-upload-panel.tsx`
- Create: `apps/web/src/features/knowledge-studio/knowledge-upload-panel.stories.tsx`

**Interfaces:**
- Consumes: `uploadKnowledgeAction`, `publishKnowledgeAction`, action state types. Uses `useActionState` + `router.refresh()` on publish success (mirrors `create-payment-sheet.tsx`).
- Produces: `KnowledgeUploadPanel()` — `"use client"`; a native `<form action={uploadFormAction}>` with `title`/`docType`/`scopes`/`file`, then on upload success shows an editable `<textarea name="extractedText">` + Publish form. Uses the shared `inputClassName` convention.

- [ ] **Step 1: Implement the client component**

```tsx
// apps/web/src/features/knowledge-studio/knowledge-upload-panel.tsx
"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadKnowledgeAction } from "./upload-knowledge-action";
import { publishKnowledgeAction } from "./publish-knowledge-action";
import { initialKnowledgeUploadState, initialKnowledgePublishState } from "./knowledge-action-types";

const inputClassName =
  "w-full rounded-md border border-border-subtle bg-background-card px-3 py-2 text-sm text-foreground";
const SCOPES = ["public_chatbot", "internal_admin", "clinical_safety", "finance", "marketing", "owner_only"];

export function KnowledgeUploadPanel() {
  const router = useRouter();
  const [upload, uploadFormAction, uploading] = useActionState(uploadKnowledgeAction, initialKnowledgeUploadState);
  const [publish, publishFormAction, publishing] = useActionState(publishKnowledgeAction, initialKnowledgePublishState);

  return (
    <div className="space-y-4">
      <form action={uploadFormAction} className="space-y-3">
        <input name="title" placeholder="Judul dokumen" required className={inputClassName} />
        <input name="docType" placeholder="Tipe (pricing, sop, faq…)" required className={inputClassName} />
        <select name="scopes" required defaultValue="public_chatbot" className={inputClassName}>
          {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input name="file" type="file" required accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg" className={inputClassName} />
        <Button type="submit" disabled={uploading}>{uploading ? "Memproses…" : "Upload & Ekstrak"}</Button>
      </form>

      {upload.status !== "idle" && upload.status !== "success" && (
        <p className="text-sm text-red-600">{upload.message}</p>
      )}

      {upload.status === "success" && (
        <form action={publishFormAction} className="space-y-2 border-t pt-3">
          <p className="text-sm text-foreground-muted">
            Tinjau teks (confidence {(upload.confidence * 100).toFixed(0)}%
            {upload.mode === "mock" ? ", mode demo" : ""}). Edit bila perlu, lalu publish.
          </p>
          <input type="hidden" name="sourceId" value={upload.sourceId} />
          <textarea name="extractedText" defaultValue={upload.extractedText} rows={8} className={inputClassName} />
          <Button type="submit" disabled={publishing}
            onClick={() => { /* refresh after publish resolves below */ }}>
            {publishing ? "Menerbitkan…" : "Publish"}
          </Button>
          {publish.status === "success" && (() => { router.refresh(); return (
            <p className="text-sm text-green-700">Terbit dengan {publish.chunkCount} chunk.</p>
          ); })()}
          {publish.status !== "idle" && publish.status !== "success" && (
            <p className="text-sm text-red-600">{publish.message}</p>
          )}
        </form>
      )}
    </div>
  );
}
```

> The inline `router.refresh()` in render is a simplification; prefer a `useEffect(() => { if (publish.status === "success") router.refresh(); }, [publish.status])`. Use the `useEffect` form to avoid refresh-during-render warnings.

- [ ] **Step 2: Add a minimal story (renders the form; actions are server-bound, so wrap with a note)**

```tsx
// apps/web/src/features/knowledge-studio/knowledge-upload-panel.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KnowledgeUploadPanel } from "./knowledge-upload-panel";

const meta: Meta<typeof KnowledgeUploadPanel> = {
  title: "KnowledgeStudio/KnowledgeUploadPanel",
  component: KnowledgeUploadPanel,
};
export default meta;
export const Default: StoryObj<typeof KnowledgeUploadPanel> = {};
```

- [ ] **Step 3: Verify typecheck + storybook build** — `corepack pnpm --dir apps/web typecheck` and `build-storybook` → PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/knowledge-studio/knowledge-upload-panel.tsx apps/web/src/features/knowledge-studio/knowledge-upload-panel.stories.tsx
git commit -m "feat(web): knowledge upload+review client panel"
```

---

### Task 18: Test Lab client component + real page wiring

**Files:**
- Create: `apps/web/src/features/knowledge-studio/knowledge-test-lab.tsx`
- Modify: `apps/web/src/app/settings/ai-management/knowledge-studio/page.tsx`

**Interfaces:**
- Consumes: `queryKnowledgeAction`, `KnowledgeQueryState`, `getCurrentUser`, `loadKnowledgeStudioPage`.
- Produces: `KnowledgeTestLab()` client component; and the server page wiring (`export const dynamic = "force-dynamic"`) that computes `canManage` from permissions, calls the loader, and renders `<KnowledgeStudioPage state={...} uploadSlot={<KnowledgeUploadPanel/>} testLabSlot={<KnowledgeTestLab/>} />`.

- [ ] **Step 1: Implement Test Lab component**

```tsx
// apps/web/src/features/knowledge-studio/knowledge-test-lab.tsx
"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { queryKnowledgeAction } from "./query-knowledge-action";
import { initialKnowledgeQueryState } from "./knowledge-action-types";

const inputClassName =
  "w-full rounded-md border border-border-subtle bg-background-card px-3 py-2 text-sm text-foreground";
const SCOPES = ["public_chatbot", "internal_admin", "clinical_safety", "finance", "marketing", "owner_only"];

export function KnowledgeTestLab() {
  const [state, formAction, pending] = useActionState(queryKnowledgeAction, initialKnowledgeQueryState);
  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-2">
        <textarea name="question" required minLength={3} rows={2} placeholder="Contoh: Berapa harga private session?" className={inputClassName} />
        <select name="scope" defaultValue="public_chatbot" className={inputClassName}>
          {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button type="submit" disabled={pending}>{pending ? "Mencari…" : "Tanya"}</Button>
      </form>
      {state.status === "success" && (
        <div className="space-y-2">
          <p className="rounded-md bg-stone-50 p-3 text-sm text-foreground">{state.answer}</p>
          {state.policyFlags.length > 0 && (
            <p className="text-xs text-amber-700">Policy flags: {state.policyFlags.join(", ")}</p>
          )}
          {state.sources.length > 0 && (
            <ul className="space-y-1 text-xs text-foreground-muted">
              {state.sources.map((s, i) => <li key={i}><strong>[{i + 1}] {s.title}:</strong> {s.snippet}</li>)}
            </ul>
          )}
          {state.mode === "mock" && <p className="text-xs text-amber-700">Mode demo (tanpa OPENAI_API_KEY).</p>}
        </div>
      )}
      {state.status !== "idle" && state.status !== "success" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire the real page**

```tsx
// apps/web/src/app/settings/ai-management/knowledge-studio/page.tsx
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadKnowledgeStudioPage } from "@/features/knowledge-studio/knowledge-studio-page-loader";
import { KnowledgeStudioPage } from "@/features/knowledge-studio/knowledge-studio-page";
import { KnowledgeUploadPanel } from "@/features/knowledge-studio/knowledge-upload-panel";
import { KnowledgeTestLab } from "@/features/knowledge-studio/knowledge-test-lab";

export const dynamic = "force-dynamic";

export default async function KnowledgeStudioSettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  const canManage = user?.permissions.includes("can_manage_knowledge") ?? false;
  const state = await loadKnowledgeStudioPage(canManage);
  return (
    <KnowledgeStudioPage
      state={state}
      uploadSlot={<KnowledgeUploadPanel />}
      testLabSlot={<KnowledgeTestLab />}
    />
  );
}
```

- [ ] **Step 3: Verify build + typecheck** — `corepack pnpm --dir apps/web typecheck` and `corepack pnpm --dir apps/web build` → PASS. Manually confirm `/settings/ai-management/knowledge-studio` and `/knowledge-studio` (redirect) still render heading "Knowledge Studio".

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/knowledge-studio/knowledge-test-lab.tsx apps/web/src/app/settings/ai-management/knowledge-studio/page.tsx
git commit -m "feat(web): knowledge Test Lab component + wire real Knowledge Studio page"
```

---

## Phase 6 — E2E, verification, docs

### Task 19: Playwright smoke (mock-mode safe)

**Files:**
- Create: `apps/web/tests/e2e/knowledge-studio.spec.ts`

**Interfaces:**
- Consumes: the rendered page. Runs in whatever mode the reused dev server is in; assertions must hold in mock mode (permission gate / mock badge) and not require an API key.

- [ ] **Step 1: Write the e2e smoke test**

```ts
// apps/web/tests/e2e/knowledge-studio.spec.ts
import { expect, test } from "@playwright/test";

test.describe("Knowledge Studio", () => {
  test("renders heading and upload/test-lab or a safe gate", async ({ page }) => {
    await page.goto("/settings/ai-management/knowledge-studio");
    await expect(page.getByRole("heading", { name: "Knowledge Studio" })).toBeVisible();
    // Either the owner sees the panels, or a non-owner/mock sees a safe state — never a crash.
    const hasUpload = await page.getByText("Upload Dokumen").count();
    const hasGate = await page.getByText(/preview|akses|Konfigurasi/i).count();
    expect(hasUpload + hasGate).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run e2e**

Run (mock is the default; the config auto-starts the dev server on :3100):
```bash
corepack pnpm --dir apps/web test:e2e -- knowledge-studio
```
Expected: PASS. If the reused server points at supabase, log in as the seeded studio_director first or set `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock` before running.

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/e2e/knowledge-studio.spec.ts
git commit -m "test(web): knowledge studio e2e smoke"
```

---

### Task 20: Docs, env example, full verification

**Files:**
- Modify: `apps/web/.env.example` (add `OPENAI_API_KEY=` name only, with a comment)
- Modify: `docs/superpowers/specs/2026-07-13-rag-knowledge-ingestion-design.md` (set Status → Implemented; note deviations: server actions instead of route handlers, gateway as lib module, deps added)
- Create: `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md` (beginner-friendly summary of what was built, how to run, how to enable real OpenAI)

- [ ] **Step 1: Update `.env.example`**

Add:
```
# Optional. Enables real OpenAI embeddings + vision for Knowledge Studio.
# Absent = deterministic mock mode (build/test without cost).
OPENAI_API_KEY=
```

- [ ] **Step 2: Write the phase log**

Create `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md` summarizing: tables/RPCs added, domain module, gateway, extractors, actions, UI; how to run locally (`supabase db reset`, set `HOM_DATA_MODE=supabase`, optional `OPENAI_API_KEY`); known limitation (synchronous processing timeout ceiling → future worker); what's out of scope (Sub-project 2 chatbot wiring).

- [ ] **Step 3: Run the full verification suite**

Run:
```bash
corepack pnpm --filter @hom/domain test
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web test:e2e
```
Expected: all PASS. Document any intentionally skipped check.

- [ ] **Step 4: Manual smoke in supabase mode (owner)**

With `HOM_DATA_MODE=supabase HOM_AUTH_MODE=supabase` and logged in as the seeded studio_director: upload a small `.xlsx` and a `.png`, review extracted text, publish, then ask a Test Lab question and confirm an answer with sources appears (mock answer if no `OPENAI_API_KEY`). Confirm an `audit_logs` row exists:
```bash
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At -c "select action from public.audit_logs where action like 'knowledge.%' order by created_at desc limit 5;"
```
Expected: rows like `knowledge.source.published`, `knowledge.source.extracted`, `knowledge.source.created`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/.env.example docs/superpowers/specs/2026-07-13-rag-knowledge-ingestion-design.md docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md
git commit -m "docs(rag): env example, phase log, spec status update"
```

---

## Self-review notes (author)

- **Spec coverage:** upload (T12) · Excel/CSV (T10 spreadsheet) · PDF (T10 pdf) · images/vision (T10 image + T9 gateway) · knowledge_sources/chunks + pgvector + RLS (T1) · RPCs + audit (T2) · owner-only RBAC (T1/T2 policies + T12/T13/T14 TS gates) · scopes (T3 schema, T2 match filter) · chunk+embed on publish (T13) · retrieval + Test Lab + policy guard (T14, T6) · AI Gateway aliases + OpenAI + mock fallback (T8/T9) · replace placeholder + fix CTA (T18) · states/stories (T15–T18) · tests (unit throughout, e2e T19) · env/docs (T20). All spec sections map to a task.
- **Deviations from spec (intentional, per codebase reality):** REST route handlers → `"use server"` actions + `submit-*` orchestrators (repo has no mutation route handlers); AI Gateway is an `apps/web/src/lib` module, not `packages/ai` (only two workspace packages exist); permission keys already seeded (no constraint migration needed); storage bucket is a new pattern (created in T1, accessed server-side via the server client).
- **Type consistency:** `KnowledgeSource` fields (`docType`, `extractedText`, `scopes[]`) are mapped identically in mock-repository, supabase repository, and rpc `mapRow`; action state unions are defined once in `knowledge-action-types.ts` and reused by orchestrator + action + component; gateway facade names (`embedText`/`embedTexts`/`extractImageText`/`answerFromContext`) are consistent across T9 producer and T12–T14 consumers.
- **Open items to verify during implementation (flagged inline):** exact `includesCatalogSearch` signature (T4); whether pgvector RPC params accept `number[]` vs stringified vector (T11 note, verify T13); exact prop names of feedback/layout components (T16); `useEffect` refresh instead of render-time refresh (T17).
