# Local Operational MVP Demo Guide

## Demo Scope

This local-only demo covers the complete operational MVP using dummy data only:

- Login with a local studio director fixture.
- Appointment create, overlap protection, reschedule, cancel, complete, no-show.
- Assign an active package to an eligible client.
- Deduct one session from a completed appointment.
- Create a manual payment (pending or paid).
- Mark a pending payment paid.
- Cancel a pending payment.
- History and audit verification.

It never links or pushes to a cloud Supabase project and uses only local dummy
records.

## 1. Start Supabase

From the repository root in PowerShell:

```powershell
corepack pnpm exec supabase start
```

## 2. Reset the Database

```powershell
corepack pnpm exec supabase db reset
```

This applies every migration and restores the clean dummy seed baseline.

## 3. Set Environment Variables

```powershell
$status = corepack pnpm exec supabase status -o env 2>&1 | Out-String
$env:NEXT_PUBLIC_SUPABASE_URL = [regex]::Match($status, 'API_URL=("?)([^\r\n"]+)\1').Groups[2].Value
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = [regex]::Match($status, 'ANON_KEY=("?)([^\r\n"]+)\1').Groups[2].Value
$env:HOM_AUTH_MODE = "supabase"
$env:HOM_DATA_MODE = "supabase"
```

## 4. Run the Dev Server

```powershell
corepack pnpm --dir apps/web dev --hostname 127.0.0.1 --port 3200
```

Open `http://127.0.0.1:3200/login`.

## 5. Login Fixture

Use this dummy local-only fixture:

```text
Email: local.studio.director@example.invalid
Password: LocalOnly-HOM-Phase4K-2026!
```

Never reuse this password outside local Supabase.

The mapped profile has the `studio_director` role with `can_manage_appointments`,
`can_reschedule_appointments`, `can_manage_client_packages`, and
`can_manage_payments`.

## 6. Appointment Workflow Checklist

1. Open `/appointments` and confirm seeded dummy appointments are visible.
2. Create a future appointment with an active client, practitioner, and service.
3. Repeat the same practitioner and overlapping time. Confirm the safe conflict
   message appears and no client details leak.
4. Reschedule an eligible appointment. Confirm the row refreshes with the amber
   `Modified` marker.
5. Cancel an eligible appointment with a short operational reason.
6. Mark another eligible appointment completed.
7. Mark another eligible appointment no-show.
8. Confirm completed rows show a `Deduct Session` control and that cancelled and
   no-show rows show `Not available`.

## 7. Package Assignment Checklist

1. Open `/client-packages` and confirm seeded dummy client packages are visible.
2. Confirm the `Assign Package` button is enabled.
3. Open the sheet, select an eligible (non-archived) client and an active
   package, and choose a purchase date/time.
4. Confirm the preview shows total sessions, starting remaining sessions, and the
   calculated expiry.
5. Submit and confirm the success state, the closed sheet, the refreshed list,
   and the new client package row.
6. Confirm no payment, contact, clinical, or WhatsApp fields are present.

## 8. Package Deduction Checklist

1. On `/appointments`, find or create a completed appointment for a client who
   owns an eligible active package.
2. Confirm the completed row shows a `Deduct Session` control.
3. Open the dialog, select an eligible package, and confirm the preview shows the
   package name, remaining before, remaining after (one fewer), and expiry.
4. Submit and confirm the refreshed row.
5. Reopen the row and confirm the control is now disabled and labelled
   `Session Deducted` (one deduction per appointment).

## 9. Payment Creation Checklist

1. Open `/payments` and confirm seeded dummy payments are visible.
2. Confirm the `Create Payment` button is enabled.
3. Open the sheet, select a non-archived client, optionally select one of that
   client's packages, enter an amount, and choose a payment method.
4. For a pending payment, leave the status `pending`; for a paid payment, choose
   `paid` and confirm the paid date field appears and is required.
5. Submit and confirm the success state and the refreshed list.
6. Confirm no card, bank account, gateway, contact, clinical, or WhatsApp fields
   are present.

## 10. Mark Paid / Cancel Payment Checklist

1. On `/payments`, find a `pending` row and confirm it shows `Mark Paid` and
   `Cancel` controls. Terminal rows (`paid`, `cancelled`) show `—`.
2. Open `Mark Paid`, confirm the paid date is prefilled, and confirm. The row
   refreshes to `paid` and its actions become `—`.
3. Open `Cancel` on another pending row, enter a short operational reason, and
   confirm. The row refreshes to `cancelled` and its actions become `—`.
4. Confirm a paid or cancelled payment no longer offers `Mark Paid` or `Cancel`.

## 11. History and Audit Verification

Optional database verification through the local container `psql`:

```powershell
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -c "select action, count(*) from public.audit_logs group by action order by action;"
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -c "select change_type, count(*) from public.package_usage_history group by change_type order by change_type;"
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -c "select to_status, count(*) from public.payment_status_history group by to_status order by to_status;"
```

Expect audit actions such as `appointment.created`, `appointment.completed`,
`appointment.rescheduled`, `appointment.cancelled`, `appointment.no_show_marked`,
`client_package.assigned`, `package_usage.recorded`, `payment.created`,
`payment.marked_paid`, and `payment.cancelled`, plus package usage rows
(`assigned`, `deducted`) and payment status history rows (`pending`, `paid`,
`cancelled`). Audit metadata contains only safe IDs and counts, never payment
secrets, card/bank numbers, cancellation reason text, notes, contact, clinical, or
WhatsApp content.

## 12. Reset After Demo

```powershell
corepack pnpm exec supabase db reset
```

This restores the clean dummy baseline.
