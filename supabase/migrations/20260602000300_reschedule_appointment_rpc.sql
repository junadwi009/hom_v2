create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_starts_at timestamptz,
  p_reason text
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
set search_path = public, private, extensions
as $$
declare
  v_actor public.app_users%rowtype;
  v_appointment public.appointments%rowtype;
  v_previous_starts_at timestamptz;
  v_previous_status text;
  v_ends_at timestamptz;
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

  if not (
    private.has_permission('can_reschedule_appointments')
    or private.has_permission('can_manage_appointments')
  ) then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_starts_at is null or p_starts_at <= now() then
    raise exception using errcode = 'P0001', message = 'START_TIME_INVALID';
  end if;

  if p_reason is null
    or char_length(trim(p_reason)) = 0
    or char_length(p_reason) > 280 then
    raise exception using errcode = 'P0001', message = 'RESCHEDULE_REASON_INVALID';
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
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_NOT_RESCHEDULABLE';
  end if;

  v_previous_starts_at := v_appointment.starts_at;
  v_previous_status := v_appointment.status;
  v_ends_at :=
    p_starts_at + make_interval(mins => v_appointment.duration_minutes);

  if exists (
    select 1
    from public.appointments
    where appointments.id <> p_appointment_id
      and appointments.practitioner_id = v_appointment.practitioner_id
      and appointments.status in ('scheduled', 'confirmed')
      and tstzrange(appointments.starts_at, appointments.ends_at, '[)')
        && tstzrange(p_starts_at, v_ends_at, '[)')
  ) then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_OVERLAP';
  end if;

  begin
    update public.appointments
    set
      starts_at = p_starts_at,
      ends_at = v_ends_at,
      reschedule_reason = trim(p_reason),
      updated_by_app_user_id = v_actor.id
    where appointments.id = p_appointment_id
    returning *
    into v_appointment;
  exception
    when exclusion_violation then
      raise exception using errcode = 'P0001', message = 'APPOINTMENT_OVERLAP';
  end;

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
    v_previous_status,
    trim(p_reason),
    v_actor.id,
    jsonb_build_object(
      'previousStartsAt', v_previous_starts_at,
      'newStartsAt', v_appointment.starts_at,
      'durationMinutes', v_appointment.duration_minutes
    )
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
    'appointment.rescheduled',
    'appointment',
    v_appointment.id,
    'high',
    jsonb_build_object(
      'previousStartsAt', v_previous_starts_at,
      'newStartsAt', v_appointment.starts_at,
      'durationMinutes', v_appointment.duration_minutes,
      'previousStatus', v_previous_status
    )
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

revoke all on function public.reschedule_appointment(uuid, timestamptz, text)
from public;
revoke all on function public.reschedule_appointment(uuid, timestamptz, text)
from anon;
grant execute on function public.reschedule_appointment(uuid, timestamptz, text)
to authenticated;

comment on function public.reschedule_appointment(uuid, timestamptz, text) is
  'Authenticated reschedule-only appointment RPC. Preserves current status and duration, checks future time and overlap, inserts status history, and writes an atomic audit row. Direct browser table writes remain blocked.';
