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
language plpgsql security definer set search_path = public, extensions, private as $$
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
