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

insert into auth.users (id, email)
values
  ('90000000-0000-4000-8000-000000000001', 'phase4h.manager@example.invalid'),
  ('90000000-0000-4000-8000-000000000002', 'phase4h.viewer@example.invalid');

insert into public.app_users (
  id,
  auth_user_id,
  full_name,
  email,
  status
)
values
  (
    '91000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    'Mock Phase 4H Manager',
    'phase4h.manager@example.invalid',
    'active'
  ),
  (
    '91000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000002',
    'Mock Phase 4H Viewer',
    'phase4h.viewer@example.invalid',
    'active'
  );

insert into public.user_roles (user_id, role_id)
select '91000000-0000-4000-8000-000000000001', roles.id
from public.roles
where roles.name = 'admin_frontdesk';

insert into public.user_roles (user_id, role_id)
select '91000000-0000-4000-8000-000000000002', roles.id
from public.roles
where roles.name = 'viewer';

select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.create_appointment(uuid,uuid,uuid,timestamptz,text,text)',
    'execute'
  ),
  'authenticated must be able to execute create_appointment'
);

select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.create_appointment(uuid,uuid,uuid,timestamptz,text,text)',
    'execute'
  ),
  'anon must not be able to execute create_appointment'
);

select pg_temp.assert_true(
  exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_practitioner_overlap'
  ),
  'overlap exclusion constraint must exist'
);

set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';

select *
from public.create_appointment(
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '2026-06-10T09:00:00+07:00',
  'admin',
  'Mock Phase 4H create.'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where created_by_app_user_id = '91000000-0000-4000-8000-000000000001'
      and starts_at = '2026-06-10T09:00:00+07:00'
      and ends_at = '2026-06-10T10:00:00+07:00'
      and duration_minutes = 60
      and status = 'scheduled'
  ),
  'RPC must copy service duration and insert scheduled appointment'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointment_status_history
    join public.appointments
      on appointments.id = appointment_status_history.appointment_id
    where appointments.created_by_app_user_id =
      '91000000-0000-4000-8000-000000000001'
      and appointments.starts_at = '2026-06-10T09:00:00+07:00'
      and appointment_status_history.from_status is null
      and appointment_status_history.to_status = 'scheduled'
  ),
  'RPC must insert initial scheduled status history'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    join public.appointments
      on appointments.id = audit_logs.target_id
    where appointments.created_by_app_user_id =
      '91000000-0000-4000-8000-000000000001'
      and appointments.starts_at = '2026-06-10T09:00:00+07:00'
      and audit_logs.action = 'appointment.created'
      and audit_logs.metadata ->> 'durationMinutes' = '60'
  ),
  'RPC must insert atomic appointment.created audit row'
);

set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.create_appointment(
      '10000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000002',
      '2026-06-10T09:30:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: overlapping appointment was accepted';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_OVERLAP' then
        raise;
      end if;
  end;
end;
$$;

select *
from public.create_appointment(
  '10000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '2026-06-10T10:00:00+07:00'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where created_by_app_user_id = '91000000-0000-4000-8000-000000000001'
      and starts_at = '2026-06-10T10:00:00+07:00'
      and ends_at = '2026-06-10T10:50:00+07:00'
      and duration_minutes = 50
  ),
  'adjacent appointment must be allowed and copy service duration'
);

set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.create_appointment(
      '10000000-0000-4000-8000-000000000008',
      '20000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      '2026-06-11T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: archived client was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_UNAVAILABLE' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.appointments
    set notes_summary = 'Mock forbidden update.'
    where id = '40000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct appointment update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.appointments
    where id = '40000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct appointment delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_appointment(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000006',
      '30000000-0000-4000-8000-000000000001',
      '2026-06-11T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: inactive practitioner was accepted';
  exception
    when others then
      if sqlerrm <> 'PRACTITIONER_UNAVAILABLE' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.appointment_status_history
    set reason = 'Mock forbidden update.'
    where id = '41000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct history update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.appointment_status_history
    where id = '41000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct history delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_appointment(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000010',
      '2026-06-11T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: inactive service was accepted';
  exception
    when others then
      if sqlerrm <> 'SERVICE_UNAVAILABLE' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.audit_logs
    set target_type = 'forbidden'
    where false;
    raise exception 'ASSERTION_FAILED: direct audit update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.audit_logs
    where false;
    raise exception 'ASSERTION_FAILED: direct audit delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000002';

do $$
begin
  begin
    perform *
    from public.create_appointment(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      '2026-06-12T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: viewer create was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
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
      '20000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      'scheduled',
      '2026-06-12T09:00:00+07:00',
      '2026-06-12T10:00:00+07:00',
      60,
      'admin'
    );
    raise exception 'ASSERTION_FAILED: direct appointment insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.appointment_status_history (
      appointment_id,
      to_status
    )
    values (
      '40000000-0000-4000-8000-000000000001',
      'scheduled'
    );
    raise exception 'ASSERTION_FAILED: direct history insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

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
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

create function pg_temp.reject_phase_4h_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'appointment.created'
    and new.metadata ->> 'clientId' =
      '10000000-0000-4000-8000-000000000003' then
    raise exception 'MOCK_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_4h_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_4h_audit();

set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.create_appointment(
      '10000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      '2026-06-13T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: audit failure did not rollback';
  exception
    when others then
      if sqlerrm <> 'MOCK_AUDIT_FAILURE' then
        raise;
      end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  not exists (
    select 1
    from public.appointments
    where created_by_app_user_id = '91000000-0000-4000-8000-000000000001'
      and starts_at = '2026-06-13T09:00:00+07:00'
  ),
  'audit failure must rollback appointment insert'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from public.appointment_status_history
    join public.appointments
      on appointments.id = appointment_status_history.appointment_id
    where appointments.created_by_app_user_id =
      '91000000-0000-4000-8000-000000000001'
      and appointments.starts_at = '2026-06-13T09:00:00+07:00'
  ),
  'audit failure must rollback status history insert'
);

select 'phase_4h_create_appointment_rpc_passed' as result;

rollback;
