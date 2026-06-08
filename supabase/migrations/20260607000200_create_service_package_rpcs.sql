-- Authenticated create RPCs for service & package catalog. Gated by
-- can_manage_services, audit-logged, SECURITY DEFINER.

create or replace function public.create_service(
  p_name text,
  p_category text,
  p_duration_minutes integer,
  p_price_idr bigint,
  p_status text
)
returns table (
  id uuid,
  name text,
  category text,
  default_duration_minutes integer,
  default_price_idr bigint,
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
  v_new public.services%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_services') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'NAME_REQUIRED';
  end if;

  if p_category is null or char_length(trim(p_category)) = 0 then
    raise exception using errcode = 'P0001', message = 'CATEGORY_REQUIRED';
  end if;

  if p_duration_minutes is null or p_duration_minutes <= 0 or p_duration_minutes > 480 then
    raise exception using errcode = 'P0001', message = 'DURATION_INVALID';
  end if;

  if p_price_idr is not null and p_price_idr < 0 then
    raise exception using errcode = 'P0001', message = 'PRICE_INVALID';
  end if;

  if p_status not in ('active', 'inactive', 'archived') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  insert into public.services (name, category, default_duration_minutes, default_price_idr, status)
  values (trim(p_name), trim(p_category), p_duration_minutes, p_price_idr, p_status)
  returning * into v_new;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'service.created', 'service', v_new.id, 'low', jsonb_build_object('status', v_new.status));

  return query
  select v_new.id, v_new.name, v_new.category, v_new.default_duration_minutes,
    v_new.default_price_idr, v_new.status, v_new.created_at, v_new.updated_at;
end;
$$;

create or replace function public.create_package(
  p_name text,
  p_package_type text,
  p_total_sessions integer,
  p_validity_days integer,
  p_price_idr bigint,
  p_status text
)
returns table (
  id uuid,
  name text,
  package_type text,
  total_sessions integer,
  validity_days integer,
  price_idr bigint,
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
  v_new public.packages%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_services') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'NAME_REQUIRED';
  end if;

  if p_package_type not in ('intro', 'session_pack', 'membership') then
    raise exception using errcode = 'P0001', message = 'TYPE_INVALID';
  end if;

  if p_total_sessions is null or p_total_sessions <= 0 then
    raise exception using errcode = 'P0001', message = 'SESSIONS_INVALID';
  end if;

  if p_validity_days is null or p_validity_days <= 0 then
    raise exception using errcode = 'P0001', message = 'VALIDITY_INVALID';
  end if;

  if p_price_idr is null or p_price_idr < 0 then
    raise exception using errcode = 'P0001', message = 'PRICE_INVALID';
  end if;

  if p_status not in ('active', 'inactive', 'archived') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  insert into public.packages (name, package_type, total_sessions, validity_days, price_idr, status)
  values (trim(p_name), p_package_type, p_total_sessions, p_validity_days, p_price_idr, p_status)
  returning * into v_new;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'package.created', 'package', v_new.id, 'low', jsonb_build_object('status', v_new.status));

  return query
  select v_new.id, v_new.name, v_new.package_type, v_new.total_sessions,
    v_new.validity_days, v_new.price_idr, v_new.status, v_new.created_at, v_new.updated_at;
end;
$$;

revoke all on function public.create_service(text, text, integer, bigint, text) from public;
revoke all on function public.create_service(text, text, integer, bigint, text) from anon;
grant execute on function public.create_service(text, text, integer, bigint, text) to authenticated;

revoke all on function public.create_package(text, text, integer, integer, bigint, text) from public;
revoke all on function public.create_package(text, text, integer, integer, bigint, text) from anon;
grant execute on function public.create_package(text, text, integer, integer, bigint, text) to authenticated;

comment on function public.create_service(text, text, integer, bigint, text) is
  'Authenticated, can_manage_services-gated service creation with audit logging.';
comment on function public.create_package(text, text, integer, integer, bigint, text) is
  'Authenticated, can_manage_services-gated package creation with audit logging.';
