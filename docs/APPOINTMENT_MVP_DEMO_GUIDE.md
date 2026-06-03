# Appointment MVP Demo Guide

## Demo Scope

This local-only demo covers login, appointment review, create, overlap protection, reschedule, cancel, complete, and no-show. It uses dummy records only.

## Start Clean

From the repository root in PowerShell:

```powershell
corepack pnpm exec supabase start
corepack pnpm exec supabase db reset

$status = corepack pnpm exec supabase status -o env 2>&1 | Out-String
$env:NEXT_PUBLIC_SUPABASE_URL = [regex]::Match($status, 'API_URL=("?)([^\r\n"]+)\1').Groups[2].Value
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = [regex]::Match($status, 'ANON_KEY=("?)([^\r\n"]+)\1').Groups[2].Value
$env:HOM_AUTH_MODE = "supabase"
$env:HOM_DATA_MODE = "supabase"

corepack pnpm --dir apps/web dev --hostname 127.0.0.1 --port 3200
```

Open `http://127.0.0.1:3200/login`.

## Local Demo Login

Use this dummy local-only fixture:

```text
Email: local.studio.director@example.invalid
Password: LocalOnly-HOM-Phase4K-2026!
```

Never reuse this password outside local Supabase.

## Demo Checklist

1. Open `/appointments` and confirm seeded dummy appointments are visible.
2. Create a future appointment with an active client, practitioner, and service.
3. Repeat the same practitioner and overlapping time. Confirm the safe conflict message appears and no client details leak.
4. Reschedule an eligible appointment. Confirm the row refreshes with the amber `Modified` marker.
5. Cancel an eligible appointment with a short operational reason.
6. Mark another eligible appointment completed.
7. Mark another eligible appointment no-show.
8. Confirm terminal rows show `Not available` instead of additional mutation actions.

## Reset After Demo

```powershell
corepack pnpm exec supabase db reset
```

This restores the clean dummy baseline.
