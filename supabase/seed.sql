insert into public.roles (name, description)
values
  ('super_admin', 'Technical/system owner with every permission.'),
  ('studio_director', 'Business owner/director with broad operational access and approvals.'),
  ('admin_frontdesk', 'Daily operations user for clients, appointments, and support workflows.'),
  ('practitioner', 'Practitioner user for assigned schedule and clinical-adjacent work later.'),
  ('finance_admin', 'Finance user for finance views and later finance operations.'),
  ('marketing_admin', 'Marketing and communication user for later WhatsApp and campaign workflows.'),
  ('viewer', 'Minimal read-only internal user.'),
  ('ai_agent_service', 'Non-human service identity for approved AI helper access only.')
on conflict (name) do update
set description = excluded.description;

insert into public.permissions (key, description)
values
  ('can_manage_users', 'Create and manage app users.'),
  ('can_manage_roles_permissions', 'Manage role and permission assignments.'),
  ('can_view_audit_logs', 'View sensitive audit logs.'),
  ('can_view_clients', 'View client records.'),
  ('can_manage_clients', 'Create and update client records.'),
  ('can_view_practitioners', 'View practitioner records.'),
  ('can_manage_practitioners', 'Create and update practitioner records.'),
  ('can_manage_services', 'Create and update service catalog records.'),
  ('can_view_team_attendance', 'View team attendance records.'),
  ('can_view_appointments', 'View appointment records.'),
  ('can_manage_appointments', 'Create and update appointment records.'),
  ('can_reschedule_appointments', 'Reschedule appointments.'),
  ('can_view_clinical_cases', 'View restricted clinical case summaries.'),
  ('can_manage_clinical_cases', 'Create and update restricted clinical case summaries.'),
  ('can_view_session_notes', 'View session notes.'),
  ('can_edit_session_notes', 'Create and edit session notes.'),
  ('can_request_note_unlock', 'Request clinical note unlock.'),
  ('can_approve_note_unlock', 'Approve or reject clinical note unlock requests.'),
  ('can_view_financials', 'View financial summaries and ledgers.'),
  ('can_edit_financials', 'Create and update financial records.'),
  ('can_export_financial_report', 'Export financial reports.'),
  ('can_approve_reimbursements', 'Approve reimbursement requests.'),
  ('can_view_whatsapp_inbox', 'View WhatsApp inbox records later.'),
  ('can_send_whatsapp_message', 'Send manual WhatsApp messages later.'),
  ('can_approve_whatsapp_blast', 'Approve WhatsApp blasts later.'),
  ('can_use_ai_business_agent', 'Use the read-only AI Business Agent later.'),
  ('can_view_ai_logs', 'View AI operation logs later.'),
  ('can_manage_knowledge', 'Create and manage Knowledge Studio drafts later.'),
  ('can_publish_knowledge', 'Publish Knowledge Studio versions later.')
on conflict (key) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.name = 'super_admin'
on conflict do nothing;

with matrix(role_name, permission_key) as (
  values
    ('studio_director', 'can_manage_users'),
    ('studio_director', 'can_view_audit_logs'),
    ('studio_director', 'can_view_clients'),
    ('studio_director', 'can_manage_clients'),
    ('studio_director', 'can_view_practitioners'),
    ('studio_director', 'can_manage_practitioners'),
    ('studio_director', 'can_manage_services'),
    ('studio_director', 'can_view_team_attendance'),
    ('studio_director', 'can_view_appointments'),
    ('studio_director', 'can_manage_appointments'),
    ('studio_director', 'can_reschedule_appointments'),
    ('studio_director', 'can_view_clinical_cases'),
    ('studio_director', 'can_manage_clinical_cases'),
    ('studio_director', 'can_view_session_notes'),
    ('studio_director', 'can_edit_session_notes'),
    ('studio_director', 'can_request_note_unlock'),
    ('studio_director', 'can_approve_note_unlock'),
    ('studio_director', 'can_view_financials'),
    ('studio_director', 'can_edit_financials'),
    ('studio_director', 'can_export_financial_report'),
    ('studio_director', 'can_approve_reimbursements'),
    ('studio_director', 'can_view_whatsapp_inbox'),
    ('studio_director', 'can_send_whatsapp_message'),
    ('studio_director', 'can_approve_whatsapp_blast'),
    ('studio_director', 'can_use_ai_business_agent'),
    ('studio_director', 'can_view_ai_logs'),
    ('studio_director', 'can_manage_knowledge'),
    ('studio_director', 'can_publish_knowledge'),

    ('admin_frontdesk', 'can_view_clients'),
    ('admin_frontdesk', 'can_manage_clients'),
    ('admin_frontdesk', 'can_view_practitioners'),
    ('admin_frontdesk', 'can_view_team_attendance'),
    ('admin_frontdesk', 'can_view_appointments'),
    ('admin_frontdesk', 'can_manage_appointments'),
    ('admin_frontdesk', 'can_reschedule_appointments'),
    ('admin_frontdesk', 'can_view_whatsapp_inbox'),
    ('admin_frontdesk', 'can_send_whatsapp_message'),

    ('practitioner', 'can_view_clients'),
    ('practitioner', 'can_view_appointments'),
    ('practitioner', 'can_view_clinical_cases'),
    ('practitioner', 'can_view_session_notes'),
    ('practitioner', 'can_edit_session_notes'),
    ('practitioner', 'can_request_note_unlock'),

    ('finance_admin', 'can_view_clients'),
    ('finance_admin', 'can_view_financials'),
    ('finance_admin', 'can_edit_financials'),
    ('finance_admin', 'can_export_financial_report'),

    ('marketing_admin', 'can_view_clients'),
    ('marketing_admin', 'can_view_whatsapp_inbox'),
    ('marketing_admin', 'can_send_whatsapp_message'),

    ('ai_agent_service', 'can_use_ai_business_agent')
)
insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from matrix
join public.roles on roles.name = matrix.role_name
join public.permissions on permissions.key = matrix.permission_key
on conflict do nothing;

insert into public.practitioners (id, app_user_id, display_name, email, status)
values
  ('20000000-0000-4000-8000-000000000001', null, 'Mock Practitioner 001', 'mock.practitioner.001@example.invalid', 'active'),
  ('20000000-0000-4000-8000-000000000002', null, 'Mock Practitioner 002', 'mock.practitioner.002@example.invalid', 'active'),
  ('20000000-0000-4000-8000-000000000003', null, 'Mock Practitioner 003', 'mock.practitioner.003@example.invalid', 'active'),
  ('20000000-0000-4000-8000-000000000004', null, 'Mock Practitioner 004', 'mock.practitioner.004@example.invalid', 'active'),
  ('20000000-0000-4000-8000-000000000005', null, 'Mock Practitioner 005', 'mock.practitioner.005@example.invalid', 'active'),
  ('20000000-0000-4000-8000-000000000006', null, 'Mock Practitioner 006', 'mock.practitioner.006@example.invalid', 'inactive'),
  ('20000000-0000-4000-8000-000000000007', null, 'Mock Practitioner 007', 'mock.practitioner.007@example.invalid', 'active'),
  ('20000000-0000-4000-8000-000000000008', null, 'Mock Practitioner 008', 'mock.practitioner.008@example.invalid', 'archived')
on conflict (id) do update
set
  app_user_id = excluded.app_user_id,
  display_name = excluded.display_name,
  email = excluded.email,
  status = excluded.status;

insert into public.clients (
  id,
  full_name,
  phone,
  email,
  status,
  primary_practitioner_id,
  created_by_app_user_id
)
values
  ('10000000-0000-4000-8000-000000000001', 'Mock Client 001', null, 'mock.client.001@example.invalid', 'active', '20000000-0000-4000-8000-000000000001', null),
  ('10000000-0000-4000-8000-000000000002', 'Mock Client 002', '+62 000-0000-0002', 'mock.client.002@example.invalid', 'active', '20000000-0000-4000-8000-000000000002', null),
  ('10000000-0000-4000-8000-000000000003', 'Mock Client 003', null, 'mock.client.003@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000003', null),
  ('10000000-0000-4000-8000-000000000004', 'Mock Client 004', '+62 000-0000-0004', 'mock.client.004@example.invalid', 'active', '20000000-0000-4000-8000-000000000004', null),
  ('10000000-0000-4000-8000-000000000005', 'Mock Client 005', null, 'mock.client.005@example.invalid', 'inactive', '20000000-0000-4000-8000-000000000005', null),
  ('10000000-0000-4000-8000-000000000006', 'Mock Client 006', '+62 000-0000-0006', 'mock.client.006@example.invalid', 'active', '20000000-0000-4000-8000-000000000006', null),
  ('10000000-0000-4000-8000-000000000007', 'Mock Client 007', null, 'mock.client.007@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000007', null),
  ('10000000-0000-4000-8000-000000000008', 'Mock Client 008', '+62 000-0000-0008', 'mock.client.008@example.invalid', 'archived', '20000000-0000-4000-8000-000000000008', null),
  ('10000000-0000-4000-8000-000000000009', 'Mock Client 009', null, 'mock.client.009@example.invalid', 'active', '20000000-0000-4000-8000-000000000001', null),
  ('10000000-0000-4000-8000-000000000010', 'Mock Client 010', '+62 000-0000-0010', 'mock.client.010@example.invalid', 'active', '20000000-0000-4000-8000-000000000002', null),
  ('10000000-0000-4000-8000-000000000011', 'Mock Client 011', null, 'mock.client.011@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000003', null),
  ('10000000-0000-4000-8000-000000000012', 'Mock Client 012', '+62 000-0000-0012', 'mock.client.012@example.invalid', 'active', '20000000-0000-4000-8000-000000000004', null),
  ('10000000-0000-4000-8000-000000000013', 'Mock Client 013', null, 'mock.client.013@example.invalid', 'inactive', '20000000-0000-4000-8000-000000000005', null),
  ('10000000-0000-4000-8000-000000000014', 'Mock Client 014', '+62 000-0000-0014', 'mock.client.014@example.invalid', 'active', '20000000-0000-4000-8000-000000000006', null),
  ('10000000-0000-4000-8000-000000000015', 'Mock Client 015', null, 'mock.client.015@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000007', null),
  ('10000000-0000-4000-8000-000000000016', 'Mock Client 016', '+62 000-0000-0016', 'mock.client.016@example.invalid', 'active', '20000000-0000-4000-8000-000000000008', null),
  ('10000000-0000-4000-8000-000000000017', 'Mock Client 017', null, 'mock.client.017@example.invalid', 'active', '20000000-0000-4000-8000-000000000001', null),
  ('10000000-0000-4000-8000-000000000018', 'Mock Client 018', '+62 000-0000-0018', 'mock.client.018@example.invalid', 'active', '20000000-0000-4000-8000-000000000002', null),
  ('10000000-0000-4000-8000-000000000019', 'Mock Client 019', null, 'mock.client.019@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000003', null),
  ('10000000-0000-4000-8000-000000000020', 'Mock Client 020', '+62 000-0000-0020', 'mock.client.020@example.invalid', 'inactive', '20000000-0000-4000-8000-000000000004', null),
  ('10000000-0000-4000-8000-000000000021', 'Mock Client 021', null, 'mock.client.021@example.invalid', 'active', '20000000-0000-4000-8000-000000000005', null),
  ('10000000-0000-4000-8000-000000000022', 'Mock Client 022', '+62 000-0000-0022', 'mock.client.022@example.invalid', 'active', '20000000-0000-4000-8000-000000000006', null),
  ('10000000-0000-4000-8000-000000000023', 'Mock Client 023', null, 'mock.client.023@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000007', null),
  ('10000000-0000-4000-8000-000000000024', 'Mock Client 024', '+62 000-0000-0024', 'mock.client.024@example.invalid', 'active', '20000000-0000-4000-8000-000000000008', null),
  ('10000000-0000-4000-8000-000000000025', 'Mock Client 025', null, 'mock.client.025@example.invalid', 'archived', '20000000-0000-4000-8000-000000000001', null),
  ('10000000-0000-4000-8000-000000000026', 'Mock Client 026', '+62 000-0000-0026', 'mock.client.026@example.invalid', 'active', '20000000-0000-4000-8000-000000000002', null),
  ('10000000-0000-4000-8000-000000000027', 'Mock Client 027', null, 'mock.client.027@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000003', null),
  ('10000000-0000-4000-8000-000000000028', 'Mock Client 028', '+62 000-0000-0028', 'mock.client.028@example.invalid', 'active', '20000000-0000-4000-8000-000000000004', null),
  ('10000000-0000-4000-8000-000000000029', 'Mock Client 029', null, 'mock.client.029@example.invalid', 'inactive', '20000000-0000-4000-8000-000000000005', null),
  ('10000000-0000-4000-8000-000000000030', 'Mock Client 030', '+62 000-0000-0030', 'mock.client.030@example.invalid', 'active', '20000000-0000-4000-8000-000000000006', null),
  ('10000000-0000-4000-8000-000000000031', 'Mock Client 031', null, 'mock.client.031@example.invalid', 'active', '20000000-0000-4000-8000-000000000007', null),
  ('10000000-0000-4000-8000-000000000032', 'Mock Client 032', '+62 000-0000-0032', 'mock.client.032@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000008', null),
  ('10000000-0000-4000-8000-000000000033', 'Mock Client 033', null, 'mock.client.033@example.invalid', 'active', '20000000-0000-4000-8000-000000000001', null),
  ('10000000-0000-4000-8000-000000000034', 'Mock Client 034', '+62 000-0000-0034', 'mock.client.034@example.invalid', 'active', '20000000-0000-4000-8000-000000000002', null),
  ('10000000-0000-4000-8000-000000000035', 'Mock Client 035', null, 'mock.client.035@example.invalid', 'inactive', '20000000-0000-4000-8000-000000000003', null),
  ('10000000-0000-4000-8000-000000000036', 'Mock Client 036', '+62 000-0000-0036', 'mock.client.036@example.invalid', 'active', '20000000-0000-4000-8000-000000000004', null),
  ('10000000-0000-4000-8000-000000000037', 'Mock Client 037', null, 'mock.client.037@example.invalid', 'prospect', '20000000-0000-4000-8000-000000000005', null),
  ('10000000-0000-4000-8000-000000000038', 'Mock Client 038', '+62 000-0000-0038', 'mock.client.038@example.invalid', 'active', '20000000-0000-4000-8000-000000000006', null),
  ('10000000-0000-4000-8000-000000000039', 'Mock Client 039', null, 'mock.client.039@example.invalid', 'active', '20000000-0000-4000-8000-000000000007', null),
  ('10000000-0000-4000-8000-000000000040', 'Mock Client 040', '+62 000-0000-0040', 'mock.client.040@example.invalid', 'archived', '20000000-0000-4000-8000-000000000008', null)
on conflict (id) do update
set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  status = excluded.status,
  primary_practitioner_id = excluded.primary_practitioner_id,
  created_by_app_user_id = excluded.created_by_app_user_id;

insert into public.services (
  id,
  name,
  category,
  default_duration_minutes,
  default_price_idr,
  status
)
values
  ('30000000-0000-4000-8000-000000000001', 'Mock Service 001 Intro Assessment', 'assessment', 60, 450000, 'active'),
  ('30000000-0000-4000-8000-000000000002', 'Mock Service 002 Private Session', 'private_session', 50, 550000, 'active'),
  ('30000000-0000-4000-8000-000000000003', 'Mock Service 003 Private Session Plus', 'private_session', 75, 750000, 'active'),
  ('30000000-0000-4000-8000-000000000004', 'Mock Service 004 Group Class', 'group_class', 50, 250000, 'active'),
  ('30000000-0000-4000-8000-000000000005', 'Mock Service 005 Group Class Plus', 'group_class', 60, 300000, 'active'),
  ('30000000-0000-4000-8000-000000000006', 'Mock Service 006 Studio Session', 'studio_session', 45, 400000, 'active'),
  ('30000000-0000-4000-8000-000000000007', 'Mock Service 007 Studio Session Plus', 'studio_session', 60, 500000, 'active'),
  ('30000000-0000-4000-8000-000000000008', 'Mock Service 008 Orientation', 'orientation', 45, 0, 'active'),
  ('30000000-0000-4000-8000-000000000009', 'Mock Service 009 Follow Up', 'follow_up', 30, 300000, 'active'),
  ('30000000-0000-4000-8000-000000000010', 'Mock Service 010 Workshop', 'workshop', 120, 900000, 'inactive'),
  ('30000000-0000-4000-8000-000000000011', 'Mock Service 011 Archived', 'archive_only', 45, null, 'archived'),
  ('30000000-0000-4000-8000-000000000012', 'Mock Service 012 Development Only', 'development_only', 30, null, 'inactive')
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  default_duration_minutes = excluded.default_duration_minutes,
  default_price_idr = excluded.default_price_idr,
  status = excluded.status;

insert into public.appointments (
  id,
  client_id,
  practitioner_id,
  service_id,
  status,
  starts_at,
  ends_at,
  duration_minutes,
  source,
  cancellation_reason,
  notes_summary
)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'scheduled', '2026-06-01T09:00:00+07:00', '2026-06-01T10:00:00+07:00', 60, 'admin', null, 'Mock operational booking 001.'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'confirmed', '2026-06-01T10:00:00+07:00', '2026-06-01T10:50:00+07:00', 50, 'admin', null, 'Mock operational booking 002.'),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'completed', '2026-05-28T11:00:00+07:00', '2026-05-28T12:15:00+07:00', 75, 'import', null, 'Mock imported booking 003.'),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'cancelled', '2026-06-02T13:00:00+07:00', '2026-06-02T13:50:00+07:00', 50, 'admin', 'Mock cancellation reason.', 'Mock cancelled booking 004.'),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 'no_show', '2026-05-29T14:00:00+07:00', '2026-05-29T15:00:00+07:00', 60, 'import', null, 'Mock imported booking 005.'),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000006', 'scheduled', '2026-06-02T09:00:00+07:00', '2026-06-02T09:45:00+07:00', 45, 'admin', null, 'Mock operational booking 006.'),
  ('40000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000007', 'confirmed', '2026-06-02T10:30:00+07:00', '2026-06-02T11:30:00+07:00', 60, 'admin', null, 'Mock operational booking 007.'),
  ('40000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000008', 'completed', '2026-05-30T09:00:00+07:00', '2026-05-30T09:45:00+07:00', 45, 'import', null, 'Mock imported booking 008.'),
  ('40000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000009', 'cancelled', '2026-06-03T09:00:00+07:00', '2026-06-03T09:30:00+07:00', 30, 'admin', 'Mock cancellation reason.', 'Mock cancelled booking 009.'),
  ('40000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'no_show', '2026-05-30T10:00:00+07:00', '2026-05-30T10:50:00+07:00', 50, 'import', null, 'Mock imported booking 010.'),
  ('40000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', 'scheduled', '2026-06-03T10:00:00+07:00', '2026-06-03T11:15:00+07:00', 75, 'admin', null, 'Mock operational booking 011.'),
  ('40000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004', 'confirmed', '2026-06-03T11:30:00+07:00', '2026-06-03T12:20:00+07:00', 50, 'admin', null, 'Mock operational booking 012.'),
  ('40000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 'completed', '2026-05-31T13:00:00+07:00', '2026-05-31T14:00:00+07:00', 60, 'import', null, 'Mock imported booking 013.'),
  ('40000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000026', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000006', 'cancelled', '2026-06-04T09:00:00+07:00', '2026-06-04T09:45:00+07:00', 45, 'admin', 'Mock cancellation reason.', 'Mock cancelled booking 014.'),
  ('40000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000028', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000007', 'no_show', '2026-05-31T10:00:00+07:00', '2026-05-31T11:00:00+07:00', 60, 'import', null, 'Mock imported booking 015.'),
  ('40000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000030', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000008', 'scheduled', '2026-06-04T10:00:00+07:00', '2026-06-04T10:45:00+07:00', 45, 'admin', null, 'Mock operational booking 016.'),
  ('40000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000031', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000009', 'confirmed', '2026-06-04T11:00:00+07:00', '2026-06-04T11:30:00+07:00', 30, 'admin', null, 'Mock operational booking 017.'),
  ('40000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000033', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000001', 'completed', '2026-05-31T15:00:00+07:00', '2026-05-31T16:00:00+07:00', 60, 'import', null, 'Mock imported booking 018.'),
  ('40000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000034', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'cancelled', '2026-06-05T09:00:00+07:00', '2026-06-05T09:50:00+07:00', 50, 'admin', 'Mock cancellation reason.', 'Mock cancelled booking 019.'),
  ('40000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000036', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 'no_show', '2026-05-31T16:00:00+07:00', '2026-05-31T17:15:00+07:00', 75, 'import', null, 'Mock imported booking 020.'),
  ('40000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000038', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', 'scheduled', '2026-06-05T10:00:00+07:00', '2026-06-05T10:50:00+07:00', 50, 'admin', null, 'Mock operational booking 021.'),
  ('40000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000039', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005', 'confirmed', '2026-06-05T11:00:00+07:00', '2026-06-05T12:00:00+07:00', 60, 'admin', null, 'Mock operational booking 022.'),
  ('40000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000006', 'completed', '2026-06-01T15:00:00+07:00', '2026-06-01T15:45:00+07:00', 45, 'import', null, 'Mock imported booking 023.'),
  ('40000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000007', 'cancelled', '2026-06-06T09:00:00+07:00', '2026-06-06T10:00:00+07:00', 60, 'admin', 'Mock cancellation reason.', 'Mock cancelled booking 024.'),
  ('40000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008', 'no_show', '2026-06-01T16:00:00+07:00', '2026-06-01T16:45:00+07:00', 45, 'import', null, 'Mock imported booking 025.')
on conflict (id) do update
set
  client_id = excluded.client_id,
  practitioner_id = excluded.practitioner_id,
  service_id = excluded.service_id,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  duration_minutes = excluded.duration_minutes,
  source = excluded.source,
  cancellation_reason = excluded.cancellation_reason,
  notes_summary = excluded.notes_summary;

insert into public.appointment_status_history (
  id,
  appointment_id,
  from_status,
  to_status,
  reason,
  metadata
)
select
  ('41000000-0000-4000-8000-' || right(appointments.id::text, 12))::uuid,
  appointments.id,
  null,
  appointments.status,
  'Mock initial local seed status.',
  '{"seed": "local_dummy"}'::jsonb
from public.appointments
where appointments.id::text like '40000000-0000-4000-8000-%'
on conflict (id) do update
set
  appointment_id = excluded.appointment_id,
  from_status = excluded.from_status,
  to_status = excluded.to_status,
  reason = excluded.reason,
  metadata = excluded.metadata;
