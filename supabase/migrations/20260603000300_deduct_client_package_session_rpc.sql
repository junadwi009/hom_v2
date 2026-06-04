-- Phase 5I: deduct exactly one package session for a completed appointment.
-- Server-only, audited, atomic. Option C hybrid/manual: completion stays a
-- separate step; deduction is an explicit, permission-checked action.

-- Idempotency backstop: a deducted usage row must reference an appointment, and
-- each appointment may deduct at most one session.
alter table public.package_usage_history
  add constraint package_usage_history_deducted_requires_appointment
  check (change_type <> 'deducted' or appointment_id is not null);

create unique index uq_package_usage_history_deducted_appointment
  on public.package_usage_history(appointment_id)
  where change_type = 'deducted';

create or replace function public.deduct_client_package_session(
  p_appointment_id uuid,
  p_client_package_id uuid
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  package_id uuid,
  package_name text,
  purchased_at timestamptz,
  expires_at timestamptz,
  total_sessions integer,
  remaining_sessions integer,
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
  v_appointment public.appointments%rowtype;
  v_client_package public.client_packages%rowtype;
  v_package public.packages%rowtype;
  v_client public.clients%rowtype;
  v_before_remaining integer;
  v_after_remaining integer;
  v_next_status text;
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

  if not private.has_permission('can_manage_client_packages') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  select appointments.*
  into v_appointment
  from public.appointments
  where appointments.id = p_appointment_id
  for update;

  if v_appointment.id is null then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_NOT_FOUND';
  end if;

  if v_appointment.status <> 'completed' then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_NOT_COMPLETED';
  end if;

  select client_packages.*
  into v_client_package
  from public.client_packages
  where client_packages.id = p_client_package_id
  for update;

  if v_client_package.id is null then
    raise exception using errcode = 'P0001', message = 'CLIENT_PACKAGE_UNAVAILABLE';
  end if;

  if v_client_package.client_id <> v_appointment.client_id then
    raise exception using errcode = 'P0001', message = 'CLIENT_PACKAGE_UNAVAILABLE';
  end if;

  if v_client_package.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'CLIENT_PACKAGE_UNAVAILABLE';
  end if;

  if v_client_package.expires_at is not null
    and v_client_package.expires_at < now() then
    raise exception using errcode = 'P0001', message = 'CLIENT_PACKAGE_UNAVAILABLE';
  end if;

  if v_client_package.remaining_sessions <= 0 then
    raise exception using errcode = 'P0001', message = 'CLIENT_PACKAGE_UNAVAILABLE';
  end if;

  if exists (
    select 1
    from public.package_usage_history
    where package_usage_history.appointment_id = p_appointment_id
      and package_usage_history.change_type = 'deducted'
  ) then
    raise exception using errcode = 'P0001', message = 'ALREADY_DEDUCTED';
  end if;

  v_before_remaining := v_client_package.remaining_sessions;
  v_after_remaining := v_before_remaining - 1;
  v_next_status := case
    when v_after_remaining = 0 then 'depleted'
    else v_client_package.status
  end;

  update public.client_packages
  set
    remaining_sessions = v_after_remaining,
    status = v_next_status
  where client_packages.id = v_client_package.id
  returning *
  into v_client_package;

  insert into public.package_usage_history (
    client_package_id,
    appointment_id,
    change_type,
    quantity,
    before_remaining,
    after_remaining,
    reason,
    actor_app_user_id
  )
  values (
    v_client_package.id,
    p_appointment_id,
    'deducted',
    1,
    v_before_remaining,
    v_after_remaining,
    null,
    v_actor.id
  );

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
    'package_usage.recorded',
    'client_package',
    v_client_package.id,
    'high',
    jsonb_build_object(
      'clientPackageId', v_client_package.id,
      'appointmentId', p_appointment_id,
      'beforeRemaining', v_before_remaining,
      'afterRemaining', v_after_remaining,
      'quantity', 1
    )
  );

  select clients.*
  into v_client
  from public.clients
  where clients.id = v_client_package.client_id;

  select packages.*
  into v_package
  from public.packages
  where packages.id = v_client_package.package_id;

  return query
  select
    v_client_package.id,
    v_client_package.client_id,
    v_client.full_name,
    v_client_package.package_id,
    v_package.name,
    v_client_package.purchased_at,
    v_client_package.expires_at,
    v_client_package.total_sessions,
    v_client_package.remaining_sessions,
    v_client_package.status,
    v_client_package.created_at,
    v_client_package.updated_at;
end;
$$;

revoke all on function public.deduct_client_package_session(uuid, uuid)
from public;

revoke all on function public.deduct_client_package_session(uuid, uuid)
from anon;

grant execute on function public.deduct_client_package_session(uuid, uuid)
to authenticated;

comment on function public.deduct_client_package_session(uuid, uuid) is
  'Authenticated deduct-only client package RPC. Deducts one session for a completed appointment, depletes at zero, inserts usage history and audit atomically, and is idempotent per appointment. Direct browser table writes remain blocked.';
