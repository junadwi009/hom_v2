# Phase UX-2 — Approval Governance Log (M1 + M2)

Batch dari audit FASE 1. Menyusul Phase UX-1 (frontend honesty). Keputusan owner
2026-07-05: `requires_second_approval` = **dual sign-off sejati**.

## M2 — Error-state jujur di Approval Center (commit `20a4109`)

- `lib/approvals/supabase/approval-queries.ts` — `fetchApprovalRequests/Rules`
  kini membedakan "tidak ada baris" (`[]`) vs "gagal memuat" (`null`); menerima
  `options.client` injectable untuk unit test (pola management-kpis-loader).
- `lib/approvals/server/approval-loader.ts` — `ApprovalCenterData.loadFailed`.
- `app/approvals/page.tsx` — saat `loadFailed`: kartu error "Data approval tidak
  dapat dimuat" + badge "Gangguan data" — TIDAK merender worklist kosong / KPI nol
  palsu (aturan repo).
- Test: `tests/unit/approvals/approval-queries.test.ts` (6 test, ditulis merah
  dulu → hijau).

## M1 — Dual sign-off sejati (commit `7939925`)

Migrasi baru **forward-only** `supabase/migrations/20260705000100_approval_dual_sign_off.sql`:
- Status baru `awaiting_second_approval` (check constraint dibangun ulang).
- `private.transition_approval_request`:
  - approve #1 (non-requester) → `awaiting_second_approval`, `approver_id` =
    penandatangan pertama, belum resolved;
  - approve #2 WAJIB orang berbeda dari requester DAN approver #1
    (`SECOND_APPROVAL_SAME_APPROVER`) → `approved` + resolved;
  - reject di tahap aktif mana pun (termasuk awaiting) → final;
  - `need_more_info`/`escalate` tetap boleh saat awaiting; approve setelahnya
    memulai ulang rantai dua tanda tangan (konservatif);
  - audit metadata + `signOffStage: first|final`.
- Lapisan TS: status baru di `approval-types`, label "Menunggu Approval Kedua"
  (tone info), `ACTIVE_STATUSES`, allowlist `asStatus`, error code baru +
  pesan Indonesia di `submit-approval-action`.

## Verifikasi

| Gate | Hasil |
|---|---|
| typecheck / lint | ✅ / ✅ |
| vitest | ✅ domain 123 + web 245 (6 test M2 baru) |
| e2e mock (`HOM_*_MODE=mock`) | ✅ 30 pass / 5 skip (1 flake kompilasi `/knowledge-studio` di satu run; lulus saat diisolasi & pada rerun penuh) |
| build-storybook | ✅ |

**Verifikasi SQL di Supabase LOKAL** (psql impersonation, transaksi di-ROLLBACK,
DB terbukti tak berubah: app_users 1, auth_users 1, demo request kembali pending):
- Requester approve sendiri → `SECOND_APPROVAL_REQUIRED_APPROVE` ✅
- Approver B tanda tangan #1 → `awaiting_second_approval`, approver=B, belum
  resolved ✅
- B coba tanda tangan #2 → `SECOND_APPROVAL_SAME_APPROVER` ✅
- Approver C tanda tangan #2 → `approved`, approver=C, resolved ✅
- Rantai events: created→pending, approved→awaiting, approved→approved ✅
- Audit `signOffStage`: first, final ✅
- Alternatif: reject saat awaiting → `rejected` final ✅

## Langkah manual owner (WAJIB sebelum fitur ini hidup di staging/prod)

1. Apply migrasi `20260705000100_approval_dual_sign_off.sql` ke Supabase remote
   (`supabase db push`, forward-only; JANGAN `db reset`). Kode UI baru aman
   dideploy sebelum/bersamaan — status lama tetap valid.
2. Ingat: push ke `main` auto-deploy Vercel; migrasi TIDAK auto-apply — apply DB
   dulu sebelum merge/push bila memungkinkan.

## Sisa temuan audit (belum dikerjakan)

- L1 i18n (tidak ada sistem i18n; teks campur EN/ID) — foundational, keputusan
  terpisah.
- L2 payload "Mock" inert di `mock-data.ts`; L3 `filter-bar.tsx` placeholder;
  L6 cek kontras `--accent-gold`/`--sidebar-muted`; L7 label tab Executive
  Command; M4 read-scope approval luas + branch scoping (relevan saat
  multi-branch); rename field `approvedThisMonth` → `approvedTotal`.
- Follow-up UI opsional: filter status di Approval Center menampilkan
  "Menunggu Approval Kedua"; badge penanda "1/2 tanda tangan" di tabel.
