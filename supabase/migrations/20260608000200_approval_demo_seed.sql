-- Phase Approval Backend — LOCAL/DEMO seed data only.
-- Idempotent (guarded by title) and uses obvious fake/demo names. Safe to skip on
-- production. Applied via `supabase migration up` so it does NOT require a db reset
-- (the existing demo financial entry is preserved).

-- Resolve a demo requester/approver from existing app_users (nullable FKs, so a
-- missing user is tolerated). Prefer the seeded local studio director.
do $$
declare
  v_actor uuid := coalesce(
    (select id from public.app_users where email = 'local.studio.director@example.invalid' limit 1),
    (select id from public.app_users order by created_at limit 1)
  );
  v_branch uuid := (select id from public.branches order by created_at limit 1);
begin
  -- Financial (critical, overdue-ish via backdated created_at)
  if not exists (select 1 from public.approval_requests where title = '[DEMO] Refund pembayaran Rp 2.400.000') then
    insert into public.approval_requests (
      title, request_type, domain, status, risk, requested_by, approver_id, branch_id,
      related_module, related_record_label, impact_label, amount_idr, reason, created_at
    ) values (
      '[DEMO] Refund pembayaran Rp 2.400.000', 'reimbursement', 'financial', 'pending', 'high',
      v_actor, v_actor, v_branch, 'payments', 'Payment #DEMO-2401', 'Rp 2,4 jt',
      2400000, 'Klien membatalkan paket sebelum sesi pertama.', now() - interval '5 hours'
    );
  end if;

  -- Clinical (critical + sensitive)
  if not exists (select 1 from public.approval_requests where title = '[DEMO] Unlock session note (kasus klinis)') then
    insert into public.approval_requests (
      title, request_type, domain, status, risk, requested_by, approver_id, branch_id,
      related_module, related_record_label, impact_label, reason, sensitive, created_at
    ) values (
      '[DEMO] Unlock session note (kasus klinis)', 'note_unlock', 'clinical', 'pending', 'critical',
      v_actor, v_actor, v_branch, 'clinical_cases', 'Case #DEMO-3320', 'Buka kunci catatan klinis terkunci',
      'Koreksi catatan setelah review praktisi senior.', true, now() - interval '30 hours'
    );
  end if;

  -- Admin & governance (critical, overdue)
  if not exists (select 1 from public.approval_requests where title = '[DEMO] Hard-delete data klien duplikat') then
    insert into public.approval_requests (
      title, request_type, domain, status, risk, requested_by, approver_id, branch_id,
      related_module, related_record_label, impact_label, reason, created_at
    ) values (
      '[DEMO] Hard-delete data klien duplikat', 'hard_delete', 'admin_governance', 'pending', 'critical',
      v_actor, v_actor, v_branch, 'clients', 'Client #DEMO-DUP', 'Penghapusan permanen data',
      'Dua profil klien duplikat hasil migrasi.', now() - interval '2 days'
    );
  end if;

  -- Marketing (high)
  if not exists (select 1 from public.approval_requests where title = '[DEMO] WhatsApp blast promo Juni (1.240 kontak)') then
    insert into public.approval_requests (
      title, request_type, domain, status, risk, requested_by, approver_id, branch_id,
      related_module, related_record_label, impact_label, reason, created_at
    ) values (
      '[DEMO] WhatsApp blast promo Juni (1.240 kontak)', 'whatsapp_blast', 'marketing', 'pending', 'high',
      v_actor, v_actor, v_branch, 'marketing', 'Campaign #DEMO-JUN', 'Pesan ke 1.240 kontak',
      'Promo membership bulan Juni.', now() - interval '3 hours'
    );
  end if;
end $$;

-- Backfill an initial "created" event for any seeded request that has none.
insert into public.approval_events (approval_request_id, action, actor_id, to_status)
select ar.id, 'created', ar.requested_by, 'pending'
from public.approval_requests ar
where not exists (
  select 1 from public.approval_events e where e.approval_request_id = ar.id
);

-- Demo approval rules.
insert into public.approval_rules (action_type, domain, condition_label, approver_role, risk)
select v.action_type, v.domain, v.condition_label, v.approver_role, v.risk
from (values
  ('reimbursement', 'financial', 'Refund/reimbursement > Rp 1 jt', 'finance_admin', 'high'),
  ('note_unlock', 'clinical', 'Unlock locked session note', 'studio_director', 'critical'),
  ('hard_delete', 'admin_governance', 'Permanent data deletion', 'super_admin', 'critical'),
  ('whatsapp_blast', 'marketing', 'Blast > 1.000 kontak', 'marketing_admin', 'high'),
  ('export_financial_report', 'financial', 'Export laporan finansial sensitif', 'finance_admin', 'high')
) as v(action_type, domain, condition_label, approver_role, risk)
where not exists (
  select 1 from public.approval_rules r
  where r.action_type = v.action_type and r.domain = v.domain and r.condition_label = v.condition_label
);
