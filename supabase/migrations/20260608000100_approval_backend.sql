-- Phase Approval Backend: persist the Approval Center.
-- Tables + read-only RLS + server-only audited RPC mutations.
-- No real side effects (refund/payment/clinical-note) are performed here — only the
-- approval request lifecycle + history + audit_logs. Direct browser table writes are
-- blocked; all mutations go through SECURITY DEFINER RPCs.

-- ---------------------------------------------------------------------------
-- Sequence for human-friendly request numbers (APR-00001, ...)
-- ---------------------------------------------------------------------------
create sequence if not exists public.approval_request_number_seq;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null
    default ('APR-' || lpad(nextval('public.approval_request_number_seq')::text, 5, '0')),
  title text not null check (char_length(title) between 1 and 200),
  request_type text not null check (char_length(request_type) between 1 and 64),
  domain text not null check (
    domain in (
      'financial',
      'client_membership',
      'booking',
      'clinical',
      'team',
      'marketing',
      'admin_governance'
    )
  ),
  status text not null default 'pending' check (
    status in (
      'draft',
      'pending',
      'need_more_info',
      'approved',
      'rejected',
      'cancelled',
      'expired',
      'auto_approved',
      'escalated'
    )
  ),
  risk text not null default 'medium' check (
    risk in ('low', 'medium', 'high', 'critical')
  ),
  requested_by uuid references public.app_users(id) on delete set null,
  approver_id uuid references public.app_users(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  related_module text,
  related_record_id uuid,
  related_record_label text,
  client_id uuid references public.clients(id) on delete set null,
  impact_label text,
  amount_idr bigint check (amount_idr is null or amount_idr >= 0),
  reason text check (reason is null or char_length(reason) <= 2000),
  risk_check text check (risk_check is null or char_length(risk_check) <= 2000),
  sensitive boolean not null default false,
  requires_second_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.approval_events (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null
    references public.approval_requests(id) on delete cascade,
  action text not null check (
    action in (
      'created',
      'viewed',
      'approved',
      'rejected',
      'need_more_info',
      'escalated',
      'commented',
      'cancelled'
    )
  ),
  actor_id uuid references public.app_users(id) on delete set null,
  note text check (note is null or char_length(note) <= 2000),
  from_status text,
  to_status text,
  created_at timestamptz not null default now()
);

create table public.approval_comments (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null
    references public.approval_requests(id) on delete cascade,
  author_id uuid references public.app_users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.approval_evidence (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null
    references public.approval_requests(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 200),
  evidence_type text not null check (
    evidence_type in (
      'receipt',
      'invoice',
      'screenshot',
      'document',
      'note',
      'diff',
      'campaign_preview'
    )
  ),
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.approval_rules (
  id uuid primary key default gen_random_uuid(),
  action_type text not null check (char_length(action_type) between 1 and 64),
  domain text not null check (
    domain in (
      'financial',
      'client_membership',
      'booking',
      'clinical',
      'team',
      'marketing',
      'admin_governance'
    )
  ),
  condition_label text not null check (char_length(condition_label) between 1 and 280),
  approver_role text not null check (char_length(approver_role) between 1 and 64),
  risk text not null check (risk in ('low', 'medium', 'high', 'critical')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger set_approval_requests_updated_at
before update on public.approval_requests
for each row execute function private.set_updated_at();

create trigger set_approval_rules_updated_at
before update on public.approval_rules
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_approval_requests_status on public.approval_requests(status);
create index idx_approval_requests_domain on public.approval_requests(domain);
create index idx_approval_requests_risk on public.approval_requests(risk);
create index idx_approval_requests_created_at on public.approval_requests(created_at desc);
create index idx_approval_events_request_created
  on public.approval_events(approval_request_id, created_at);
create index idx_approval_comments_request
  on public.approval_comments(approval_request_id, created_at);
create index idx_approval_evidence_request
  on public.approval_evidence(approval_request_id);
create index idx_approval_rules_active on public.approval_rules(is_active);

-- ---------------------------------------------------------------------------
-- Permission helpers (private)
-- ---------------------------------------------------------------------------
create or replace function private.has_owner_role()
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select exists (
    select 1
    from public.app_users au
    join public.user_roles ur on ur.user_id = au.id
    join public.roles r on r.id = ur.role_id
    where au.auth_user_id = auth.uid()
      and r.name in ('super_admin', 'studio_director')
  )
$$;

-- Broad gate: may the current user open the Approval Center at all?
create or replace function private.can_access_approvals()
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select
    private.has_owner_role()
    or private.has_permission('can_manage_users')
    or private.has_permission('can_manage_roles_permissions')
    or private.has_permission('can_approve_whatsapp_blast')
    or private.has_permission('can_approve_note_unlock')
    or private.has_permission('can_approve_reimbursements')
    or private.has_permission('can_publish_knowledge')
    or private.has_permission('can_export_financial_report')
    or private.has_permission('can_edit_financials')
    or private.has_permission('can_view_financials')
    or private.has_permission('can_manage_clinical_cases')
    or private.has_permission('can_view_clinical_cases')
$$;

-- Per-request approve gate, mirroring features/approvals/approval-helpers.ts.
create or replace function private.can_approve_request(p_type text, p_domain text)
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select case
    when private.has_owner_role() then true
    when p_type = 'whatsapp_blast' then private.has_permission('can_approve_whatsapp_blast')
    when p_type = 'note_unlock' then private.has_permission('can_approve_note_unlock')
    when p_type = 'reimbursement' then private.has_permission('can_approve_reimbursements')
    when p_type = 'publish_knowledge' then private.has_permission('can_publish_knowledge')
    when p_type in ('export_financial_report', 'client_data_export')
      then private.has_permission('can_export_financial_report')
    when p_type = 'role_assignment' then private.has_permission('can_manage_roles_permissions')
    when p_type in ('hard_delete', 'branch_change', 'branch_open_close', 'production_integration')
      then private.has_permission('can_manage_users')
    when p_domain = 'financial'
      then private.has_permission('can_approve_reimbursements')
        or private.has_permission('can_edit_financials')
    when p_domain = 'clinical' then private.has_permission('can_approve_note_unlock')
    else private.has_permission('can_manage_users')
  end
$$;

revoke all on function private.has_owner_role() from public;
revoke all on function private.can_access_approvals() from public;
revoke all on function private.can_approve_request(text, text) from public;
grant execute on function private.has_owner_role() to authenticated;
grant execute on function private.can_access_approvals() to authenticated;
grant execute on function private.can_approve_request(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — read-only from the browser, gated by approval-center access.
-- All writes are blocked at the table level and only happen via the RPCs below.
-- ---------------------------------------------------------------------------
alter table public.approval_requests enable row level security;
alter table public.approval_events enable row level security;
alter table public.approval_comments enable row level security;
alter table public.approval_evidence enable row level security;
alter table public.approval_rules enable row level security;

revoke all on public.approval_requests from public, anon, authenticated;
revoke all on public.approval_events from public, anon, authenticated;
revoke all on public.approval_comments from public, anon, authenticated;
revoke all on public.approval_evidence from public, anon, authenticated;
revoke all on public.approval_rules from public, anon, authenticated;

grant select on public.approval_requests to authenticated;
grant select on public.approval_events to authenticated;
grant select on public.approval_comments to authenticated;
grant select on public.approval_evidence to authenticated;
grant select on public.approval_rules to authenticated;

create policy "approval viewers can read requests"
on public.approval_requests for select to authenticated
using (private.can_access_approvals());

create policy "approval viewers can read events"
on public.approval_events for select to authenticated
using (private.can_access_approvals());

create policy "approval viewers can read comments"
on public.approval_comments for select to authenticated
using (private.can_access_approvals());

create policy "approval viewers can read evidence"
on public.approval_evidence for select to authenticated
using (private.can_access_approvals());

create policy "approval viewers can read rules"
on public.approval_rules for select to authenticated
using (private.can_access_approvals());

-- ---------------------------------------------------------------------------
-- Shared row shape for request-returning RPCs (a view has a usable row type).
-- Fully-shaped row (joins + aggregated events/evidence as jsonb) so the TS loader
-- can map 1:1 to the existing ApprovalRequest UI type. Lives in `private` and is
-- only read from inside SECURITY DEFINER RPCs (which run as owner, bypassing RLS).
-- ---------------------------------------------------------------------------
create view private.approval_request_rows as
  select
    ar.id,
    ar.request_number,
    ar.title,
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
    ar.related_record_label,
    ar.client_id,
    c.full_name as client_name,
    ar.impact_label,
    ar.amount_idr,
    ar.reason,
    ar.risk_check,
    ar.sensitive,
    ar.requires_second_approval,
    round(extract(epoch from (now() - ar.created_at)) / 3600.0, 1) as waiting_hours,
    ar.created_at,
    ar.updated_at,
    ar.resolved_at,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'action', e.action,
          'actorName', actor.full_name,
          'timestamp', e.created_at,
          'note', e.note
        ) order by e.created_at
      )
      from public.approval_events e
      left join public.app_users actor on actor.id = e.actor_id
      where e.approval_request_id = ar.id
    ), '[]'::jsonb) as events,
    coalesce((
      select jsonb_agg(
        jsonb_build_object('id', ev.id, 'label', ev.label, 'type', ev.evidence_type)
      )
      from public.approval_evidence ev
      where ev.approval_request_id = ar.id
    ), '[]'::jsonb) as evidence
  from public.approval_requests ar
  left join public.app_users req on req.id = ar.requested_by
  left join public.app_users apr on apr.id = ar.approver_id
  left join public.branches b on b.id = ar.branch_id
  left join public.clients c on c.id = ar.client_id;

-- ---------------------------------------------------------------------------
-- RPC: list approval requests
-- ---------------------------------------------------------------------------
create or replace function public.list_approval_requests(
  p_limit int default 100,
  p_status text default null,
  p_domain text default null
)
returns setof private.approval_request_rows
language plpgsql
security definer
set search_path = public, private
stable
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;
  if not private.can_access_approvals() then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  return query
  select *
  from private.approval_request_rows
  where (p_status is null or status = p_status)
    and (p_domain is null or domain = p_domain)
  order by
    case risk
      when 'critical' then 4 when 'high' then 3 when 'medium' then 2 else 1
    end desc,
    created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

revoke all on function public.list_approval_requests(int, text, text) from public, anon;
grant execute on function public.list_approval_requests(int, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: list approval rules
-- ---------------------------------------------------------------------------
create or replace function public.list_approval_rules()
returns setof public.approval_rules
language plpgsql
security definer
set search_path = public, private
stable
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;
  if not private.can_access_approvals() then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;
  return query select * from public.approval_rules order by domain, action_type;
end;
$$;

revoke all on function public.list_approval_rules() from public, anon;
grant execute on function public.list_approval_rules() to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: create approval request
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

  -- Broad gate for creation; stricter per-type mapping is a documented TODO.
  if not private.can_access_approvals() then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception using errcode = 'P0001', message = 'TITLE_REQUIRED';
  end if;
  if p_domain not in (
    'financial','client_membership','booking','clinical','team','marketing','admin_governance'
  ) then
    raise exception using errcode = 'P0001', message = 'DOMAIN_INVALID';
  end if;
  if p_risk not in ('low','medium','high','critical') then
    raise exception using errcode = 'P0001', message = 'RISK_INVALID';
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
-- Shared transition helper used by approve/reject/more-info/escalate.
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
      'hasNote', v_note is not null
    )
  );

  return v_request.id;
end;
$$;

revoke all on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) from public, anon;
grant execute on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs: approve / reject / request more info / escalate
-- ---------------------------------------------------------------------------
create or replace function public.approve_approval_request(p_request_id uuid, p_note text default null)
returns setof private.approval_request_rows
language plpgsql security definer set search_path = public, private
as $$
declare v_id uuid;
begin
  v_id := private.transition_approval_request(p_request_id, 'approved', 'approved', p_note, null, true);
  return query select * from private.approval_request_rows where id = v_id;
end;
$$;

create or replace function public.reject_approval_request(p_request_id uuid, p_note text default null)
returns setof private.approval_request_rows
language plpgsql security definer set search_path = public, private
as $$
declare v_id uuid;
begin
  v_id := private.transition_approval_request(p_request_id, 'rejected', 'rejected', p_note, null, true);
  return query select * from private.approval_request_rows where id = v_id;
end;
$$;

create or replace function public.request_approval_more_info(p_request_id uuid, p_note text default null)
returns setof private.approval_request_rows
language plpgsql security definer set search_path = public, private
as $$
declare v_id uuid;
begin
  v_id := private.transition_approval_request(p_request_id, 'need_more_info', 'need_more_info', p_note, null, false);
  return query select * from private.approval_request_rows where id = v_id;
end;
$$;

create or replace function public.escalate_approval_request(
  p_request_id uuid, p_note text default null, p_new_approver_id uuid default null
)
returns setof private.approval_request_rows
language plpgsql security definer set search_path = public, private
as $$
declare v_id uuid;
begin
  v_id := private.transition_approval_request(p_request_id, 'escalated', 'escalated', p_note, p_new_approver_id, false);
  return query select * from private.approval_request_rows where id = v_id;
end;
$$;

revoke all on function public.approve_approval_request(uuid, text) from public, anon;
revoke all on function public.reject_approval_request(uuid, text) from public, anon;
revoke all on function public.request_approval_more_info(uuid, text) from public, anon;
revoke all on function public.escalate_approval_request(uuid, text, uuid) from public, anon;
grant execute on function public.approve_approval_request(uuid, text) to authenticated;
grant execute on function public.reject_approval_request(uuid, text) to authenticated;
grant execute on function public.request_approval_more_info(uuid, text) to authenticated;
grant execute on function public.escalate_approval_request(uuid, text, uuid) to authenticated;

comment on table public.approval_requests is
  'Approval Center requests. Read-only from the browser (RLS gated by approval access); all writes via SECURITY DEFINER RPCs that also write approval_events + audit_logs. No real refund/payment/clinical side effects yet.';
comment on table public.approval_events is
  'Append-only approval lifecycle history.';
comment on table public.approval_rules is
  'Configurable approval rules backing the Approval Rules view.';
