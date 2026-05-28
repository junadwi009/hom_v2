# Codex Prompt — Phase 2 Core Data Foundation

Implement only Phase 2 after Phase 0 and Phase 1 are stable.

Goal: create the first operational modules: clients, practitioners, services, and appointments.

Read:
- `docs/04_DATABASE_SCHEMA.md`
- `docs/05_API_CONTRACTS.md`
- `docs/10_SECURITY_AND_GOVERNANCE.md`
- `docs/11_TESTING_AND_QUALITY_GATES.md`
- `docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md`

Tasks:

1. Create database migrations for:
   - users/profiles if needed
   - roles/permissions
   - clients
   - practitioners
   - services
   - appointments
   - appointment_status_history
   - audit_logs
2. Add RLS policies for sensitive tables.
3. Create typed data access layer.
4. Create appointment service with double-booking validation.
5. Create basic screens:
   - clients list
   - practitioners list
   - services list
   - appointments list/calendar placeholder
6. Add audit logs for sensitive changes.
7. Add tests for appointment overlap rules.

Constraints:

- Do not implement finance yet.
- Do not implement AI yet.
- Do not implement WhatsApp yet.
- Do not let frontend write directly to sensitive tables without server validation.

Return summary, changed files, checks run, and next step.
