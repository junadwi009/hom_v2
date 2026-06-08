-- Authenticated create-client RPC. Permission-gated (can_manage_clients),
-- audit-logged. SECURITY DEFINER so the insert runs server-side; direct browser
-- table writes stay blocked by RLS.
create or replace function public.create_client(
  p_full_name text,
  p_phone text,
  p_email text,
  p_status text
)
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.clients%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.*
  into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_clients') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_full_name is null or char_length(trim(p_full_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'FULL_NAME_REQUIRED';
  end if;

  if char_length(trim(p_full_name)) > 120 then
    raise exception using errcode = 'P0001', message = 'FULL_NAME_TOO_LONG';
  end if;

  if p_status not in ('active', 'inactive', 'prospect', 'archived') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  insert into public.clients (
    full_name,
    phone,
    email,
    status,
    created_by_app_user_id
  )
  values (
    trim(p_full_name),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    p_status,
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (
    actor_user_id,
    actor_auth_user_id,
    action,
    target_type,
    target_id,
    risk_level,
    metadata
  )
  values (
    v_actor.id,
    auth.uid(),
    'client.created',
    'client',
    v_new.id,
    'low',
    jsonb_build_object('status', v_new.status)
  );

  return query
  select
    v_new.id,
    v_new.full_name,
    v_new.phone,
    v_new.email,
    v_new.status,
    v_new.created_at,
    v_new.updated_at;
end;
$$;

revoke all on function public.create_client(text, text, text, text) from public;
revoke all on function public.create_client(text, text, text, text) from anon;
grant execute on function public.create_client(text, text, text, text) to authenticated;

comment on function public.create_client(text, text, text, text) is
  'Authenticated, can_manage_clients-gated client creation with audit logging.';
