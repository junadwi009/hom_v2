create or replace function public.complete_appointment(
  p_appointment_id uuid
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  practitioner_id uuid,
  practitioner_name text,
  service_id uuid,
  service_name text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  source text,
  notes_summary text,
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
  v_previous_status text;
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

  if not private.has_permission('can_manage_appointments') then
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

  if v_appointment.status not in ('scheduled', 'confirmed') then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_NOT_COMPLETABLE';
  end if;

  v_previous_status := v_appointment.status;

  update public.appointments
  set
    status = 'completed',
    updated_by_app_user_id = v_actor.id
  where appointments.id = p_appointment_id
  returning *
  into v_appointment;

  insert into public.appointment_status_history (
    appointment_id,
    from_status,
    to_status,
    actor_app_user_id,
    metadata
  )
  values (
    v_appointment.id,
    v_previous_status,
    'completed',
    v_actor.id,
    jsonb_build_object('source', 'complete_appointment_rpc')
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
    'appointment.completed',
    'appointment',
    v_appointment.id,
    'high',
    jsonb_build_object('previousStatus', v_previous_status)
  );

  return query
  select
    v_appointment.id,
    v_appointment.client_id,
    clients.full_name,
    v_appointment.practitioner_id,
    practitioners.display_name,
    v_appointment.service_id,
    services.name,
    v_appointment.status,
    v_appointment.starts_at,
    v_appointment.ends_at,
    v_appointment.duration_minutes,
    v_appointment.source,
    v_appointment.notes_summary,
    v_appointment.created_at,
    v_appointment.updated_at
  from public.clients
  join public.practitioners
    on practitioners.id = v_appointment.practitioner_id
  join public.services
    on services.id = v_appointment.service_id
  where clients.id = v_appointment.client_id;
end;
$$;

revoke all on function public.complete_appointment(uuid) from public;
revoke all on function public.complete_appointment(uuid) from anon;
grant execute on function public.complete_appointment(uuid) to authenticated;

comment on function public.complete_appointment(uuid) is
  'Authenticated completion-only appointment RPC. Marks scheduled or confirmed appointments completed with status history and atomic audit logging. Direct browser table writes remain blocked.';

create or replace function public.mark_appointment_no_show(
  p_appointment_id uuid,
  p_reason text default null
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  practitioner_id uuid,
  practitioner_name text,
  service_id uuid,
  service_name text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  source text,
  notes_summary text,
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
  v_previous_status text;
  v_reason text;
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

  if not private.has_permission('can_manage_appointments') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  v_reason := nullif(trim(p_reason), '');

  if v_reason is not null and char_length(v_reason) > 280 then
    raise exception using errcode = 'P0001', message = 'NO_SHOW_REASON_INVALID';
  end if;

  select appointments.*
  into v_appointment
  from public.appointments
  where appointments.id = p_appointment_id
  for update;

  if v_appointment.id is null then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_NOT_FOUND';
  end if;

  if v_appointment.status not in ('scheduled', 'confirmed') then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_NOT_MARKABLE_NO_SHOW';
  end if;

  v_previous_status := v_appointment.status;

  update public.appointments
  set
    status = 'no_show',
    updated_by_app_user_id = v_actor.id
  where appointments.id = p_appointment_id
  returning *
  into v_appointment;

  insert into public.appointment_status_history (
    appointment_id,
    from_status,
    to_status,
    reason,
    actor_app_user_id,
    metadata
  )
  values (
    v_appointment.id,
    v_previous_status,
    'no_show',
    v_reason,
    v_actor.id,
    jsonb_build_object('source', 'mark_appointment_no_show_rpc')
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
    'appointment.no_show_marked',
    'appointment',
    v_appointment.id,
    'high',
    jsonb_build_object('previousStatus', v_previous_status)
  );

  return query
  select
    v_appointment.id,
    v_appointment.client_id,
    clients.full_name,
    v_appointment.practitioner_id,
    practitioners.display_name,
    v_appointment.service_id,
    services.name,
    v_appointment.status,
    v_appointment.starts_at,
    v_appointment.ends_at,
    v_appointment.duration_minutes,
    v_appointment.source,
    v_appointment.notes_summary,
    v_appointment.created_at,
    v_appointment.updated_at
  from public.clients
  join public.practitioners
    on practitioners.id = v_appointment.practitioner_id
  join public.services
    on services.id = v_appointment.service_id
  where clients.id = v_appointment.client_id;
end;
$$;

revoke all on function public.mark_appointment_no_show(uuid, text) from public;
revoke all on function public.mark_appointment_no_show(uuid, text) from anon;
grant execute on function public.mark_appointment_no_show(uuid, text)
to authenticated;

comment on function public.mark_appointment_no_show(uuid, text) is
  'Authenticated no-show-only appointment RPC. Marks scheduled or confirmed appointments no-show with optional short operational reason, status history, and atomic audit logging. Direct browser table writes remain blocked.';
