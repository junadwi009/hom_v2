-- Phase Approval Backend — Pre-Merge Hardening.
--   1. Title redaction for sensitive/clinical requests (extends the data-layer
--      redaction from 20260608000300).
--   2. Stricter create gate: private.can_create_approval_request(type, domain) +
--      FK existence checks + client-reference guard.
--   3. Segregation of duties: enforce requires_second_approval in the shared
--      transition helper (requester cannot approve/reject their own request).
-- No real approval side-effects are implemented (status-only, as before).

-- ---------------------------------------------------------------------------
-- 1) Title redaction — rebuild the redaction-aware view to ALSO redact title.
--    Column names/types/order are unchanged so dependent RPCs stay valid.
-- ---------------------------------------------------------------------------
create or replace view private.approval_request_rows as
  select
    ar.id,
    ar.request_number,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Permintaan approval klinis'
      else ar.title
    end as title,
    ar.request_type,
    ar.domain,
    ar.status,
    ar.risk,
    ar.requested_by,
    req.full_name as requester_name,
    (
      select r.name from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = ar.requested_by order by r.name limit 1
    ) as requester_role,
    ar.approver_id,
    apr.full_name as approver_name,
    (
      select r.name from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = ar.approver_id order by r.name limit 1
    ) as approver_role,
    ar.branch_id,
    b.name as branch_name,
    ar.related_module,
    ar.related_record_id,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Clinical record hidden'
      else ar.related_record_label
    end as related_record_label,
    ar.client_id,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then null
      else c.full_name
    end as client_name,
    ar.impact_label,
    ar.amount_idr,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Detail klinis disembunyikan. Membutuhkan akses Clinical Lead/Owner.'
      else ar.reason
    end as reason,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Risk check disembunyikan karena data klinis sensitif.'
      else ar.risk_check
    end as risk_check,
    ar.sensitive,
    ar.requires_second_approval,
    round(extract(epoch from (now() - ar.created_at)) / 3600.0, 1) as waiting_hours,
    ar.created_at,
    ar.updated_at,
    ar.resolved_at,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then '[]'::jsonb
      else coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'action', e.action,
            'actorName', actor.full_name,
            'timestamp', e.created_at,
            'note', case
              when (ar.sensitive or ar.domain = 'clinical')
                and not private.can_view_sensitive_approval_details()
              then null
              else e.note
            end
          ) order by e.created_at
        )
        from public.approval_events e
        left join public.app_users actor on actor.id = e.actor_id
        where e.approval_request_id = ar.id
      ), '[]'::jsonb)
    end as events,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then '[]'::jsonb
      else coalesce((
        select jsonb_agg(
          jsonb_build_object('id', ev.id, 'label', ev.label, 'type', ev.evidence_type)
        )
        from public.approval_evidence ev
        where ev.approval_request_id = ar.id
      ), '[]'::jsonb)
    end as evidence
  from public.approval_requests ar
  left join public.app_users req on req.id = ar.requested_by
  left join public.app_users apr on apr.id = ar.approver_id
  left join public.branches b on b.id = ar.branch_id
  left join public.clients c on c.id = ar.client_id;

-- ---------------------------------------------------------------------------
-- 2) Stricter create gate — per-domain permission mapping.
-- All keys exist in the permission catalog (no compromises required).
-- ---------------------------------------------------------------------------
create or replace function private.can_create_approval_request(
  p_request_type text,
  p_domain text
)
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select case
    when private.has_owner_role() then true
    when p_domain = 'financial' then
      private.has_permission('can_edit_financials')
      or private.has_permission('can_approve_reimbursements')
      or private.has_permission('can_manage_payments')
    when p_domain = 'clinical' then
      private.has_permission('can_manage_clinical_cases')
      or private.has_permission('can_request_note_unlock')
      or private.has_permission('can_approve_note_unlock')
    when p_domain = 'marketing' then
      private.has_permission('can_approve_whatsapp_blast')
      or private.has_permission('can_publish_knowledge')
      or private.has_permission('can_manage_knowledge')
    when p_domain = 'admin_governance' then
      private.has_permission('can_manage_users')
      or private.has_permission('can_manage_roles_permissions')
    when p_domain = 'client_membership' then
      private.has_permission('can_manage_clients')
      or private.has_permission('can_manage_client_packages')
    when p_domain = 'booking' then
      private.has_permission('can_manage_appointments')
      or private.has_permission('can_reschedule_appointments')
    when p_domain = 'team' then
      private.has_permission('can_manage_practitioners')
    else false
  end
$$;

revoke all on function private.can_create_approval_request(text, text) from public;
grant execute on function private.can_create_approval_request(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- create_approval_request — replace broad gate with the per-domain gate; add
-- FK existence checks + client-reference guard.
-- ---------------------------------------------------------------------------
create or replace function public.create_approval_request(
  p_title text,
  p_request_type text,
  p_domain text,
  p_risk text,
  p_approver_id uuid default null,
  p_branch_id uuid default null,
  p_related_module text default null,
  p_related_record_id uuid default null,
  p_related_record_label text default null,
  p_client_id uuid default null,
  p_impact_label text default null,
  p_amount_idr bigint default null,
  p_reason text default null,
  p_risk_check text default null,
  p_sensitive boolean default false,
  p_requires_second_approval boolean default false
)
returns setof private.approval_request_rows
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_request public.approval_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select * into v_actor from public.app_users
  where auth_user_id = auth.uid() and status = 'active' limit 1;
  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if p_domain not in (
    'financial','client_membership','booking','clinical','team','marketing','admin_governance'
  ) then
    raise exception using errcode = 'P0001', message = 'DOMAIN_INVALID';
  end if;
  if p_risk not in ('low','medium','high','critical') then
    raise exception using errcode = 'P0001', message = 'RISK_INVALID';
  end if;
  if p_title is null or btrim(p_title) = '' then
    raise exception using errcode = 'P0001', message = 'TITLE_REQUIRED';
  end if;

  -- Stricter, per-domain create permission (replaces broad can_access_approvals).
  if not private.can_create_approval_request(p_request_type, p_domain) then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  -- FK existence checks.
  if p_branch_id is not null
     and not exists (select 1 from public.branches where id = p_branch_id) then
    raise exception using errcode = 'P0001', message = 'BRANCH_NOT_FOUND';
  end if;
  if p_approver_id is not null
     and not exists (select 1 from public.app_users where id = p_approver_id and status = 'active') then
    raise exception using errcode = 'P0001', message = 'APPROVER_NOT_FOUND';
  end if;
  if p_client_id is not null then
    if not exists (select 1 from public.clients where id = p_client_id) then
      raise exception using errcode = 'P0001', message = 'CLIENT_NOT_FOUND';
    end if;
    -- Don't let users who can't see clients enumerate client names via guessed ids.
    if not (
      private.has_owner_role()
      or private.has_permission('can_view_clients')
      or private.has_permission('can_manage_clients')
    ) then
      raise exception using errcode = 'P0001', message = 'CLIENT_REF_NOT_ALLOWED';
    end if;
  end if;

  insert into public.approval_requests (
    title, request_type, domain, status, risk, requested_by, approver_id, branch_id,
    related_module, related_record_id, related_record_label, client_id, impact_label,
    amount_idr, reason, risk_check, sensitive, requires_second_approval
  ) values (
    btrim(p_title), p_request_type, p_domain, 'pending', p_risk, v_actor.id, p_approver_id,
    p_branch_id, p_related_module, p_related_record_id, p_related_record_label, p_client_id,
    p_impact_label, p_amount_idr, nullif(btrim(p_reason), ''), nullif(btrim(p_risk_check), ''),
    coalesce(p_sensitive, false), coalesce(p_requires_second_approval, false)
  ) returning * into v_request;

  insert into public.approval_events (approval_request_id, action, actor_id, to_status)
  values (v_request.id, 'created', v_actor.id, 'pending');

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  ) values (
    v_actor.id, auth.uid(), 'approval_request.created', 'approval_request', v_request.id,
    p_risk, jsonb_build_object('requestNumber', v_request.request_number, 'domain', p_domain, 'type', p_request_type)
  );

  return query select * from private.approval_request_rows where id = v_request.id;
end;
$$;

revoke all on function public.create_approval_request(
  text, text, text, text, uuid, uuid, text, uuid, text, uuid, text, bigint, text, text, boolean, boolean
) from public, anon;
grant execute on function public.create_approval_request(
  text, text, text, text, uuid, uuid, text, uuid, text, uuid, text, bigint, text, text, boolean, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Segregation of duties — enforce requires_second_approval in the shared
-- transition helper. Requester may not approve/reject their own second-approval
-- request, and cannot escalate it to themselves.
-- ---------------------------------------------------------------------------
create or replace function private.transition_approval_request(
  p_request_id uuid,
  p_action text,
  p_new_status text,
  p_note text,
  p_new_approver_id uuid,
  p_set_resolved boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_request public.approval_requests%rowtype;
  v_note text := nullif(btrim(p_note), '');
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select * into v_actor from public.app_users
  where auth_user_id = auth.uid() and status = 'active' limit 1;
  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  select * into v_request from public.approval_requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception using errcode = 'P0001', message = 'REQUEST_NOT_FOUND';
  end if;

  if v_request.status not in ('pending', 'need_more_info', 'escalated') then
    raise exception using errcode = 'P0001', message = 'REQUEST_NOT_ACTIVE';
  end if;

  if not private.can_approve_request(v_request.request_type, v_request.domain) then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  -- Segregation of duties for second-approval requests.
  if v_request.requires_second_approval then
    if p_action = 'approved' and v_actor.id = v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_REQUIRED_APPROVE';
    end if;
    if p_action = 'rejected' and v_actor.id = v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_REQUIRED_REJECT';
    end if;
    if p_action = 'escalated'
       and p_new_approver_id is not null
       and p_new_approver_id = v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_INVALID_APPROVER';
    end if;
  end if;

  -- Note requirements mirror the UI: reject/more-info always; approve for
  -- high/critical; escalate for critical.
  if p_action in ('rejected', 'need_more_info') and v_note is null then
    raise exception using errcode = 'P0001', message = 'NOTE_REQUIRED';
  end if;
  if p_action = 'approved' and v_request.risk in ('high', 'critical') and v_note is null then
    raise exception using errcode = 'P0001', message = 'NOTE_REQUIRED';
  end if;
  if p_action = 'escalated' and v_request.risk = 'critical' and v_note is null then
    raise exception using errcode = 'P0001', message = 'NOTE_REQUIRED';
  end if;

  update public.approval_requests
  set status = p_new_status,
      approver_id = coalesce(p_new_approver_id, approver_id),
      resolved_at = case when p_set_resolved then now() else resolved_at end
  where id = v_request.id;

  insert into public.approval_events (
    approval_request_id, action, actor_id, note, from_status, to_status
  ) values (
    v_request.id, p_action, v_actor.id, v_note, v_request.status, p_new_status
  );

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  ) values (
    v_actor.id, auth.uid(), 'approval_request.' || p_action, 'approval_request', v_request.id,
    v_request.risk,
    jsonb_build_object(
      'requestNumber', v_request.request_number,
      'fromStatus', v_request.status,
      'toStatus', p_new_status,
      'hasNote', v_note is not null,
      'secondApproval', v_request.requires_second_approval
    )
  );

  return v_request.id;
end;
$$;

revoke all on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) from public, anon;
grant execute on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) to authenticated;

comment on function private.can_create_approval_request(text, text) is
  'Per-domain create gate for approval requests (mirrors the create permission model). Owner role bypasses. Used by create_approval_request instead of the broad read gate.';

-- ---------------------------------------------------------------------------
-- LOCAL/DEV ONLY: mark one demo request as requiring a second approval so the
-- SoD guard is browser-testable. Guarded by the local seed user (no-op on
-- staging/production). Does not delete or reset any data.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.app_users where email = 'local.studio.director@example.invalid'
  ) then
    update public.approval_requests
    set requires_second_approval = true
    where title = '[DEMO] Refund pembayaran Rp 2.400.000';
  end if;
end $$;
