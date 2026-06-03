\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not condition then
    raise exception 'ASSERTION_FAILED: %', message;
  end if;
end;
$$;

select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.get_current_app_user_context()',
    'execute'
  ),
  'authenticated must be able to execute get_current_app_user_context'
);

select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.get_current_app_user_context()',
    'execute'
  ),
  'anon must not be able to execute get_current_app_user_context'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  exists (
    select 1
    from public.get_current_app_user_context()
    where full_name = 'Local Studio Director'
      and 'studio_director' = any(roles)
      and 'can_manage_appointments' = any(permissions)
  ),
  'local Studio Director context must include appointment management permission'
);

select *
from public.create_appointment(
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '2036-06-20T09:00:00+07:00',
  'admin',
  'Mock Phase 4K local auth create.'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where created_by_app_user_id = '94000000-0000-4000-8000-000000000001'
      and starts_at = '2036-06-20T09:00:00+07:00'
  ),
  'local Studio Director must be able to create an appointment through the RPC'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointment_status_history
    join public.appointments
      on appointments.id = appointment_status_history.appointment_id
    where appointments.created_by_app_user_id =
      '94000000-0000-4000-8000-000000000001'
      and appointments.starts_at = '2036-06-20T09:00:00+07:00'
      and appointment_status_history.to_status = 'scheduled'
  ),
  'local Studio Director create must add status history'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    join public.appointments
      on appointments.id = audit_logs.target_id
    where appointments.created_by_app_user_id =
      '94000000-0000-4000-8000-000000000001'
      and appointments.starts_at = '2036-06-20T09:00:00+07:00'
      and audit_logs.action = 'appointment.created'
  ),
  'local Studio Director create must add an atomic audit row'
);

insert into auth.users (id, email)
values
  ('96000000-0000-4000-8000-000000000001', 'phase4k.unmapped@example.invalid'),
  ('96000000-0000-4000-8000-000000000002', 'phase4k.inactive@example.invalid');

insert into public.app_users (
  id,
  auth_user_id,
  full_name,
  email,
  status
)
values (
  '97000000-0000-4000-8000-000000000002',
  '96000000-0000-4000-8000-000000000002',
  'Mock Phase 4K Inactive',
  'phase4k.inactive@example.invalid',
  'inactive'
);

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform * from public.get_current_app_user_context();
    raise exception 'ASSERTION_FAILED: unmapped auth user was accepted';
  exception
    when others then
      if sqlerrm <> 'APP_USER_REQUIRED' then
        raise;
      end if;
  end;
end;
$$;

set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';

do $$
begin
  begin
    perform * from public.get_current_app_user_context();
    raise exception 'ASSERTION_FAILED: inactive app user was accepted';
  exception
    when others then
      if sqlerrm <> 'APP_USER_INACTIVE' then
        raise;
      end if;
  end;
end;
$$;

set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    insert into public.audit_logs (
      action,
      target_type,
      risk_level
    )
    values (
      'appointment.created',
      'appointment',
      'high'
    );
    raise exception 'ASSERTION_FAILED: direct authenticated audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.appointments (
      client_id,
      practitioner_id,
      service_id,
      status,
      starts_at,
      ends_at,
      duration_minutes,
      source
    )
    values (
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      'scheduled',
      '2036-06-20T11:00:00+07:00',
      '2036-06-20T12:00:00+07:00',
      60,
      'admin'
    );
    raise exception 'ASSERTION_FAILED: direct authenticated appointment insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select 'phase_4k_minimum_local_auth_passed' as result;

rollback;
