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

-- Function privileges.
select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.create_manual_payment(uuid,uuid,bigint,text,text,timestamptz,text,text)',
    'execute'
  ),
  'authenticated must execute create_manual_payment'
);
select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.create_manual_payment(uuid,uuid,bigint,text,text,timestamptz,text,text)',
    'execute'
  ),
  'anon must not execute create_manual_payment'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

-- Pending payment, unlinked, no paid_at (amount marker 760001).
select *
from public.create_manual_payment(
  '10000000-0000-4000-8000-000000000001',
  null,
  760001,
  'cash',
  'pending',
  null,
  'MOCK-PAY-9001',
  'Mock pending front desk note.'
);

-- Paid payment, linked to the client's own package (amount marker 760002).
select *
from public.create_manual_payment(
  '10000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000001',
  760002,
  'bank_transfer',
  'paid',
  '2026-06-03T03:00:00+07:00',
  'MOCK-PAY-9002',
  null
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.payments
    where client_id = '10000000-0000-4000-8000-000000000001'
      and amount_idr = 760001
      and status = 'pending'
      and paid_at is null
      and client_package_id is null
      and created_by_app_user_id = '94000000-0000-4000-8000-000000000001'
  ),
  'pending payment must insert with paid_at null'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.payments
    where client_id = '10000000-0000-4000-8000-000000000001'
      and amount_idr = 760002
      and status = 'paid'
      and paid_at is not null
      and client_package_id = '51000000-0000-4000-8000-000000000001'
  ),
  'paid payment must insert with paid_at set and a linked package'
);

select pg_temp.assert_true(
  (select count(*)
   from public.payment_status_history psh
   join public.payments p on p.id = psh.payment_id
   where p.amount_idr in (760001, 760002)
     and psh.from_status is null
     and psh.to_status = p.status) = 2,
  'each created payment must insert an initial status history row'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs a
    join public.payments p on p.id = a.target_id
    where a.action = 'payment.created'
      and a.target_type = 'payment'
      and a.risk_level = 'high'
      and p.amount_idr = 760002
      and a.metadata ->> 'amountIdr' = '760002'
      and a.metadata ->> 'paymentMethod' = 'bank_transfer'
      and a.metadata ->> 'status' = 'paid'
      and a.metadata ->> 'clientPackageId' =
        '51000000-0000-4000-8000-000000000001'
      and (a.metadata ? 'notes') is false
      and (a.metadata ? 'referenceNumber') is false
  ),
  'payment.created audit must hold safe metadata without notes or reference'
);

-- Negative scenarios.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001', null, 0, 'cash', 'pending',
      null, null, null
    );
    raise exception 'ASSERTION_FAILED: non-positive amount was accepted';
  exception
    when others then
      if sqlerrm <> 'AMOUNT_INVALID' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001', null, 100000, 'cash', 'refunded',
      null, null, null
    );
    raise exception 'ASSERTION_FAILED: invalid create status was accepted';
  exception
    when others then
      if sqlerrm <> 'PAYMENT_STATUS_INVALID' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001', null, 100000, 'cash', 'paid',
      null, null, null
    );
    raise exception 'ASSERTION_FAILED: paid without paid_at was accepted';
  exception
    when others then
      if sqlerrm <> 'PAYMENT_PAID_AT_REQUIRED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001', null, 100000, 'cash', 'pending',
      now(), null, null
    );
    raise exception 'ASSERTION_FAILED: pending with paid_at was accepted';
  exception
    when others then
      if sqlerrm <> 'PAYMENT_PAID_AT_NOT_ALLOWED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000008', null, 100000, 'cash', 'pending',
      null, null, null
    );
    raise exception 'ASSERTION_FAILED: archived client was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000003',
      100000, 'cash', 'pending', null, null, null
    );
    raise exception 'ASSERTION_FAILED: mismatched client package was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.payments (client_id, amount_idr, payment_method, status)
    values ('10000000-0000-4000-8000-000000000001', 1, 'cash', 'pending');
    raise exception 'ASSERTION_FAILED: direct payment insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.payments set status = status where amount_idr = 760001;
    raise exception 'ASSERTION_FAILED: direct payment update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.payments where amount_idr = 760001;
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
    values (
      (select id from public.payments where amount_idr = 760001 limit 1),
      'paid'
    );
    raise exception 'ASSERTION_FAILED: direct payment history insert was accepted';
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

-- No-permission user denied.
insert into auth.users (id, email)
values (
  '96000000-0000-4000-8000-000000000020',
  'phase6e.noaccess@example.invalid'
);
insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '97000000-0000-4000-8000-000000000020',
  '96000000-0000-4000-8000-000000000020',
  'Mock Phase 6E No Access',
  'phase6e.noaccess@example.invalid',
  'active'
);

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000020';

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001', null, 100000, 'cash', 'pending',
      null, null, null
    );
    raise exception 'ASSERTION_FAILED: no-permission create was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

reset role;

-- Rollback when the audit insert fails (amount marker 99999).
create function pg_temp.reject_phase_6e_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'payment.created'
    and new.metadata ->> 'amountIdr' = '99999' then
    raise exception 'MOCK_PAYMENT_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_6e_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_6e_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.create_manual_payment(
      '10000000-0000-4000-8000-000000000001', null, 99999, 'cash', 'pending',
      null, null, null
    );
    raise exception 'ASSERTION_FAILED: audit failure did not roll back payment';
  exception
    when others then
      if sqlerrm <> 'MOCK_PAYMENT_AUDIT_FAILURE' then raise; end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  not exists (
    select 1 from public.payments where amount_idr = 99999
  ),
  'audit failure must roll back the payment insert'
);
select pg_temp.assert_true(
  not exists (
    select 1
    from public.payment_status_history psh
    join public.payments p on p.id = psh.payment_id
    where p.amount_idr = 99999
  ),
  'audit failure must roll back the status history insert'
);

select 'phase_6e_create_manual_payment_rpc_passed' as result;

rollback;
