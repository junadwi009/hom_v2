create schema if not exists extensions;

create extension if not exists btree_gist with schema extensions;

alter table public.appointments
add constraint appointments_no_practitioner_overlap
exclude using gist (
  practitioner_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
)
where (status in ('scheduled', 'confirmed'));

create or replace function public.create_appointment(
  p_client_id uuid,
  p_practitioner_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_source text default 'admin',
  p_notes_summary text default null
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
  v_client public.clients%rowtype;
  v_practitioner public.practitioners%rowtype;
  v_service public.services%rowtype;
  v_appointment public.appointments%rowtype;
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

  if not private.has_permission('can_manage_appointments') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  select clients.*
  into v_client
  from public.clients
  where clients.id = p_client_id
    and clients.status <> 'archived'
  limit 1;

  if v_client.id is null then
    raise exception using errcode = 'P0001', message = 'CLIENT_UNAVAILABLE';
  end if;

  select practitioners.*
  into v_practitioner
  from public.practitioners
  where practitioners.id = p_practitioner_id
    and practitioners.status = 'active'
  limit 1;

  if v_practitioner.id is null then
    raise exception using errcode = 'P0001', message = 'PRACTITIONER_UNAVAILABLE';
  end if;

  select services.*
  into v_service
  from public.services
  where services.id = p_service_id
    and services.status = 'active'
  limit 1;

  if v_service.id is null then
    raise exception using errcode = 'P0001', message = 'SERVICE_UNAVAILABLE';
  end if;

  if p_starts_at is null then
    raise exception using errcode = 'P0001', message = 'START_TIME_REQUIRED';
  end if;

  if p_source is null
    or p_source not in ('admin', 'import', 'whatsapp_request', 'ai_draft') then
    raise exception using errcode = 'P0001', message = 'SOURCE_INVALID';
  end if;

  if p_notes_summary is not null
    and (
      char_length(trim(p_notes_summary)) = 0
      or char_length(p_notes_summary) > 280
    ) then
    raise exception using errcode = 'P0001', message = 'NOTES_SUMMARY_INVALID';
  end if;

  v_ends_at :=
    p_starts_at + make_interval(mins => v_service.default_duration_minutes);

  if exists (
    select 1
    from public.appointments
    where appointments.practitioner_id = p_practitioner_id
      and appointments.status in ('scheduled', 'confirmed')
      and tstzrange(appointments.starts_at, appointments.ends_at, '[)')
        && tstzrange(p_starts_at, v_ends_at, '[)')
  ) then
    raise exception using errcode = 'P0001', message = 'APPOINTMENT_OVERLAP';
  end if;

  begin
    insert into public.appointments (
      client_id,
      practitioner_id,
      service_id,
      status,
      starts_at,
      ends_at,
      duration_minutes,
      source,
      notes_summary,
      created_by_app_user_id,
      updated_by_app_user_id
    )
    values (
      p_client_id,
      p_practitioner_id,
      p_service_id,
      'scheduled',
      p_starts_at,
      v_ends_at,
      v_service.default_duration_minutes,
      p_source,
      p_notes_summary,
      v_actor.id,
      v_actor.id
    )
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
    actor_app_user_id,
    metadata
  )
  values (
    v_appointment.id,
    null,
    'scheduled',
    v_actor.id,
    jsonb_build_object('source', 'create_appointment_rpc')
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
    'appointment.created',
    'appointment',
    v_appointment.id,
    'high',
    jsonb_build_object(
      'source', p_source,
      'durationMinutes', v_service.default_duration_minutes,
      'clientId', p_client_id,
      'practitionerId', p_practitioner_id,
      'serviceId', p_service_id
    )
  );

  return query
  select
    v_appointment.id,
    v_appointment.client_id,
    v_client.full_name,
    v_appointment.practitioner_id,
    v_practitioner.display_name,
    v_appointment.service_id,
    v_service.name,
    v_appointment.status,
    v_appointment.starts_at,
    v_appointment.ends_at,
    v_appointment.duration_minutes,
    v_appointment.source,
    v_appointment.notes_summary,
    v_appointment.created_at,
    v_appointment.updated_at;
end;
$$;

revoke all on function public.create_appointment(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  text
) from public;

revoke all on function public.create_appointment(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  text
) from anon;

grant execute on function public.create_appointment(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  text
) to authenticated;

comment on function public.create_appointment(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  text
) is
  'Authenticated create-only appointment RPC. Performs permission, catalog, duration, overlap, status-history, and audit checks atomically. Direct browser table writes remain blocked.';
