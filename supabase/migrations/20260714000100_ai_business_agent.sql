-- 20260714000100_ai_business_agent.sql
-- (1) create or replace public.match_knowledge_chunks(...) with the widened gate — full body copied
--     from 20260713000200_knowledge_rpcs.sql, only the permission gate changed to also accept
--     can_use_ai_business_agent.

create or replace function public.match_knowledge_chunks(
  p_query_embedding extensions.vector, p_scopes text[], p_match_count int
) returns table(source_id uuid, source_title text, chunk_index int, content text, distance float)
language plpgsql security definer set search_path = public, extensions, private as $$
declare v_actor public.app_users;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not (private.has_permission('can_manage_knowledge') or private.has_owner_role()
          or private.has_permission('can_use_ai_business_agent')) then
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

-- (2) audit RPC for read-only AI Business Agent interactions.
create or replace function public.record_ai_interaction(
  p_action text, p_target_id uuid, p_metadata jsonb
) returns void
language plpgsql security definer set search_path = public, private as $$
declare v_actor public.app_users;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not (private.has_permission('can_use_ai_business_agent') or private.has_owner_role()) then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;
  if p_action !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception using errcode='P0001', message='ACTION_INVALID'; end if;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), p_action, 'ai_interaction', p_target_id, 'low', coalesce(p_metadata, '{}'::jsonb));
end $$;

revoke all on function public.record_ai_interaction(text, uuid, jsonb) from public, anon;
grant execute on function public.record_ai_interaction(text, uuid, jsonb) to authenticated;
