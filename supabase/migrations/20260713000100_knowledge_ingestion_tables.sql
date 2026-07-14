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
