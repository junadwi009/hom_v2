-- 20260714000200_knowledge_scope_acl.sql
-- SECURITY FIX: public.match_knowledge_chunks is SECURITY DEFINER, granted to `authenticated`,
-- and directly callable via PostgREST. Its permission gate accepts can_use_ai_business_agent,
-- but previously trusted the caller-supplied p_scopes with no DB-side restriction — a principal
-- holding only can_use_ai_business_agent (e.g. the ai_agent_service role) could pass
-- p_scopes=['finance','clinical_safety','owner_only'] and read sensitive published chunks,
-- bypassing the app-layer allowedKnowledgeScopes check.
--
-- Fix: compute the caller's allowed scopes DB-side (mirroring the app's allowedKnowledgeScopes
-- logic), intersect with the requested p_scopes, and filter on the intersection instead of on
-- p_scopes directly. The DB is now the authority, not just the app layer.

create or replace function public.match_knowledge_chunks(
  p_query_embedding extensions.vector, p_scopes text[], p_match_count int
) returns table(source_id uuid, source_title text, chunk_index int, content text, distance float)
language plpgsql security definer set search_path = public, extensions, private as $$
declare
  v_actor public.app_users;
  v_allowed text[];
  v_effective text[];
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not (private.has_permission('can_manage_knowledge') or private.has_owner_role()
          or private.has_permission('can_use_ai_business_agent')) then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;

  -- DB-authoritative scope ACL: mirror the app's allowedKnowledgeScopes computation so a raw
  -- RPC call cannot request scopes beyond what this caller's permissions allow.
  v_allowed := array['public_chatbot', 'internal_admin', 'marketing'];
  if private.has_permission('can_view_financials') then
    v_allowed := array_append(v_allowed, 'finance');
  end if;
  if private.has_permission('can_view_clinical_cases') then
    v_allowed := array_append(v_allowed, 'clinical_safety');
  end if;
  if private.has_permission('can_publish_knowledge') then
    v_allowed := array_append(v_allowed, 'owner_only');
  end if;

  v_effective := array(select unnest(p_scopes) intersect select unnest(v_allowed));

  return query
  select kc.source_id, ks.title, kc.chunk_index, kc.content,
         (kc.embedding <=> p_query_embedding) as distance
  from public.knowledge_chunks kc
  join public.knowledge_sources ks on ks.id = kc.source_id
  where ks.status = 'published'
    and ks.scopes && v_effective
  order by kc.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 5), 20));
end $$;
