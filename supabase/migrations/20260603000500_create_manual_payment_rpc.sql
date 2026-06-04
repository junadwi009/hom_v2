-- Phase 6E: create one manual payment record through a server-only audited RPC.
-- No payment gateway, settlement, card/bank secrets, refund, or partial payment.

create or replace function public.create_manual_payment(
  p_client_id uuid,
  p_client_package_id uuid,
  p_amount_idr bigint,
  p_payment_method text,
  p_status text,
  p_paid_at timestamptz,
  p_reference_number text,
  p_notes text
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  client_package_id uuid,
  package_name text,
  amount_idr bigint,
  payment_method text,
  status text,
  paid_at timestamptz,
  reference_number text,
  notes text,
  created_by_app_user_id uuid,
  updated_by_app_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_client public.clients%rowtype;
  v_client_package public.client_packages%rowtype;
  v_package_name text;
  v_payment public.payments%rowtype;
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

  if not private.has_permission('can_manage_payments') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_amount_idr is null or p_amount_idr <= 0 then
    raise exception using errcode = 'P0001', message = 'AMOUNT_INVALID';
  end if;

  if p_payment_method not in ('cash', 'bank_transfer', 'card', 'e_wallet', 'other') then
    raise exception using errcode = 'P0001', message = 'PAYMENT_METHOD_INVALID';
  end if;

  if p_status not in ('pending', 'paid') then
    raise exception using errcode = 'P0001', message = 'PAYMENT_STATUS_INVALID';
  end if;

  if p_status = 'paid' and p_paid_at is null then
    raise exception using errcode = 'P0001', message = 'PAYMENT_PAID_AT_REQUIRED';
  end if;

  if p_status = 'pending' and p_paid_at is not null then
    raise exception using errcode = 'P0001', message = 'PAYMENT_PAID_AT_NOT_ALLOWED';
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

  if p_client_package_id is not null then
    select client_packages.*
    into v_client_package
    from public.client_packages
    where client_packages.id = p_client_package_id
    limit 1;

    if v_client_package.id is null
      or v_client_package.client_id <> v_client.id then
      raise exception using errcode = 'P0001', message = 'CLIENT_PACKAGE_UNAVAILABLE';
    end if;
  end if;

  insert into public.payments (
    client_id,
    client_package_id,
    amount_idr,
    payment_method,
    status,
    paid_at,
    reference_number,
    notes,
    created_by_app_user_id,
    updated_by_app_user_id
  )
  values (
    v_client.id,
    p_client_package_id,
    p_amount_idr,
    p_payment_method,
    p_status,
    p_paid_at,
    nullif(btrim(p_reference_number), ''),
    nullif(btrim(p_notes), ''),
    v_actor.id,
    v_actor.id
  )
  returning *
  into v_payment;

  insert into public.payment_status_history (
    payment_id,
    from_status,
    to_status,
    reason,
    actor_app_user_id,
    metadata
  )
  values (
    v_payment.id,
    null,
    v_payment.status,
    null,
    v_actor.id,
    jsonb_build_object('paymentId', v_payment.id)
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
    'payment.created',
    'payment',
    v_payment.id,
    'high',
    jsonb_build_object(
      'paymentId', v_payment.id,
      'clientId', v_client.id,
      'clientPackageId', p_client_package_id,
      'amountIdr', v_payment.amount_idr,
      'paymentMethod', v_payment.payment_method,
      'status', v_payment.status
    )
  );

  if v_payment.client_package_id is not null then
    select packages.name
    into v_package_name
    from public.client_packages
    join public.packages on packages.id = client_packages.package_id
    where client_packages.id = v_payment.client_package_id;
  end if;

  return query
  select
    v_payment.id,
    v_payment.client_id,
    v_client.full_name,
    v_payment.client_package_id,
    v_package_name,
    v_payment.amount_idr,
    v_payment.payment_method,
    v_payment.status,
    v_payment.paid_at,
    v_payment.reference_number,
    v_payment.notes,
    v_payment.created_by_app_user_id,
    v_payment.updated_by_app_user_id,
    v_payment.created_at,
    v_payment.updated_at;
end;
$$;

revoke all on function public.create_manual_payment(
  uuid, uuid, bigint, text, text, timestamptz, text, text
) from public;

revoke all on function public.create_manual_payment(
  uuid, uuid, bigint, text, text, timestamptz, text, text
) from anon;

grant execute on function public.create_manual_payment(
  uuid, uuid, bigint, text, text, timestamptz, text, text
) to authenticated;

comment on function public.create_manual_payment(
  uuid, uuid, bigint, text, text, timestamptz, text, text
) is
  'Authenticated create-only manual payment RPC. Validates client/package ownership and pending|paid status, inserts the payment, initial status history, and an atomic payment.created audit row. No gateway, card, or bank secret data is stored. Direct browser table writes remain blocked.';
