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

-- Tables exist.
select pg_temp.assert_true(
  to_regclass('public.payments') is not null,
  'payments table must exist'
);
select pg_temp.assert_true(
  to_regclass('public.payment_status_history') is not null,
  'payment_status_history table must exist'
);

-- Seed counts.
select pg_temp.assert_true(
  (select count(*) from public.payments) = 24,
  'payments seed count must be 24'
);
select pg_temp.assert_true(
  (select count(*) from public.payment_status_history) = 24,
  'payment_status_history seed count must be 24'
);
select pg_temp.assert_true(
  (select count(*) from public.payments where status = 'paid') > 0
    and (select count(*) from public.payments where status = 'pending') > 0,
  'payments seed must mix pending and paid'
);

-- RLS enabled.
select pg_temp.assert_true(
  (select relrowsecurity from pg_class where oid = 'public.payments'::regclass),
  'payments must have RLS enabled'
);
select pg_temp.assert_true(
  (select relrowsecurity
   from pg_class
   where oid = 'public.payment_status_history'::regclass),
  'payment_status_history must have RLS enabled'
);

-- Payment permissions exist and are granted to the expected roles.
select pg_temp.assert_true(
  exists (select 1 from public.permissions where key = 'can_view_payments')
    and exists (select 1 from public.permissions where key = 'can_manage_payments'),
  'payment permissions must exist'
);

select pg_temp.assert_true(
  (select count(distinct roles.name)
   from public.roles
   join public.role_permissions on role_permissions.role_id = roles.id
   join public.permissions on permissions.id = role_permissions.permission_id
   where permissions.key = 'can_view_payments'
     and roles.name in ('super_admin', 'studio_director', 'finance_admin')) = 3,
  'super_admin, studio_director, and finance_admin must hold can_view_payments'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from public.roles
    join public.role_permissions on role_permissions.role_id = roles.id
    join public.permissions on permissions.id = role_permissions.permission_id
    where permissions.key = 'can_view_payments'
      and roles.name = 'admin_frontdesk'
  ),
  'admin_frontdesk must not hold can_view_payments yet'
);

-- Local Studio Director can read payments and history.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  (select count(*) from public.payments) = 24,
  'studio director must read all payments'
);
select pg_temp.assert_true(
  (select count(*) from public.payment_status_history) = 24,
  'studio director must read all payment status history'
);

-- Direct authenticated writes remain blocked.
do $$
begin
  begin
    insert into public.payments (client_id, amount_idr, payment_method, status)
    values (
      '10000000-0000-4000-8000-000000000001', 100000, 'cash', 'pending'
    );
    raise exception 'ASSERTION_FAILED: direct payment insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.payments
    set status = status
    where id = '60000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct payment update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.payments
    where id = '60000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct payment delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.payment_status_history (payment_id, to_status)
    values ('60000000-0000-4000-8000-000000000001', 'paid');
    raise exception 'ASSERTION_FAILED: direct payment history insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.payment_status_history
    set reason = reason
    where id = '61000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct payment history update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.payment_status_history
    where id = '61000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct payment history delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.audit_logs (action, target_type, risk_level)
    values ('payment.created', 'payment', 'high');
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

-- Finance Admin fixture can read payments.
insert into auth.users (id, email)
values (
  '96000000-0000-4000-8000-000000000010',
  'phase6c.finance@example.invalid'
);
insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '97000000-0000-4000-8000-000000000010',
  '96000000-0000-4000-8000-000000000010',
  'Mock Phase 6C Finance',
  'phase6c.finance@example.invalid',
  'active'
);
insert into public.user_roles (user_id, role_id)
select '97000000-0000-4000-8000-000000000010', roles.id
from public.roles
where roles.name = 'finance_admin';

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000010';

select pg_temp.assert_true(
  (select count(*) from public.payments) = 24,
  'finance admin must read all payments'
);

reset role;

-- No-permission user cannot read payments.
insert into auth.users (id, email)
values (
  '96000000-0000-4000-8000-000000000011',
  'phase6c.noaccess@example.invalid'
);
insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '97000000-0000-4000-8000-000000000011',
  '96000000-0000-4000-8000-000000000011',
  'Mock Phase 6C No Access',
  'phase6c.noaccess@example.invalid',
  'active'
);

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000011';

select pg_temp.assert_true(
  (select count(*) from public.payments) = 0,
  'no-permission user must not read payments'
);
select pg_temp.assert_true(
  (select count(*) from public.payment_status_history) = 0,
  'no-permission user must not read payment status history'
);

reset role;

select 'phase_6c_payment_local_db_passed' as result;

rollback;
