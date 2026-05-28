create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from anon;
revoke all on schema private from authenticated;

comment on schema private is
  'Internal helper schema for HOM Studio OS v2. Do not expose through the public API.';

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'knowledge_source_status'
  ) then
    create type public.knowledge_source_status as enum (
      'uploaded',
      'processing',
      'extracted',
      'review_needed',
      'approved',
      'embedded',
      'tested',
      'published',
      'archived',
      'failed'
    );
  end if;
end
$$;
