-- Phase Approval Backend — Security Hardening (C1 + M3).
-- C1: redact sensitive clinical fields at the DATA layer (the view), so unauthorized
--     approvers never receive them in the payload (UI hiding alone is insufficient).
-- M3: align private.can_access_approvals() with the TypeScript canAccessApprovalCenter
--     gate (single documented permission set).
-- No schema/column changes; no new tables; no real approval side effects.

-- ---------------------------------------------------------------------------
-- C1 — sensitive clinical access helper
-- ---------------------------------------------------------------------------
-- A caller may see sensitive clinical detail only with clinical access or owner role.
create or replace function private.can_view_sensitive_approval_details()
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select
    private.has_owner_role()
    or private.has_permission('can_view_clinical_cases')
    or private.has_permission('can_approve_note_unlock')
$$;

revoke all on function private.can_view_sensitive_approval_details() from public;
grant execute on function private.can_view_sensitive_approval_details() to authenticated;

-- ---------------------------------------------------------------------------
-- M3 — align approval-center access gate with TypeScript canAccessApprovalCenter.
-- CANONICAL SET (keep identical to APPROVAL_CENTER_ACCESS_PERMISSIONS in
-- apps/web/src/features/approvals/approval-helpers.ts):
--   can_manage_users, can_manage_roles_permissions, can_view_audit_logs,
--   can_approve_whatsapp_blast, can_request_note_unlock, can_approve_note_unlock,
--   can_approve_reimbursements, can_publish_knowledge, can_export_financial_report,
--   can_view_financials, can_edit_financials, can_view_clinical_cases,
--   can_manage_clinical_cases, can_manage_clients, can_manage_appointments,
--   can_manage_practitioners  (+ owner roles super_admin / studio_director)
-- ---------------------------------------------------------------------------
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
    or private.has_permission('can_view_audit_logs')
    or private.has_permission('can_approve_whatsapp_blast')
    or private.has_permission('can_request_note_unlock')
    or private.has_permission('can_approve_note_unlock')
    or private.has_permission('can_approve_reimbursements')
    or private.has_permission('can_publish_knowledge')
    or private.has_permission('can_export_financial_report')
    or private.has_permission('can_view_financials')
    or private.has_permission('can_edit_financials')
    or private.has_permission('can_view_clinical_cases')
    or private.has_permission('can_manage_clinical_cases')
    or private.has_permission('can_manage_clients')
    or private.has_permission('can_manage_appointments')
    or private.has_permission('can_manage_practitioners')
$$;

-- ---------------------------------------------------------------------------
-- C1 — redacted row view. Column names/types/order are unchanged (so the RPCs
-- that `returns setof private.approval_request_rows` and `create or replace view`
-- both remain valid). Sensitive rows (sensitive = true OR domain = 'clinical')
-- have PHI-bearing fields redacted for callers without clinical access.
-- ---------------------------------------------------------------------------
create or replace view private.approval_request_rows as
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
            -- Notes can echo the clinical reason — null them for unauthorized
            -- callers even though the rest of the history is structural.
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

comment on function private.can_view_sensitive_approval_details() is
  'True when the caller may see sensitive clinical approval detail (owner role, can_view_clinical_cases, or can_approve_note_unlock). Used by the approval_request_rows view to redact PHI at the data layer.';
