# Update Log — Audit Findings Fixes (data honesty)

- **Tanggal:** 2026-07-14
- **Branch:** `phase-audit-fixes` (off `main` setelah `phase-approval-backend`
  di-fast-forward ke `main`)
- **Konteks:** melanjutkan "perbaikan temuan audit" dari `LATEST.md`.

## Ringkasan keputusan (dikonfirmasi user)
- **Revenue "bulan ini" → sumber kanonik = pembayaran lunas** (tabel
  `payments`, `status='paid'`, bulan kalender berjalan).
- **"Create Request" (Approval Center) → biarkan placeholder** ("segera hadir").
  Bukan bug jujur; membangun flow request manual = fitur baru, di luar batch ini.

## Yang diperbaiki

### Bug #4 — Timer "Menunggu" jalan di approval yang sudah diputus ✅
- **Akar masalah:** view `private.approval_request_rows` menghitung
  `waiting_hours = now() - created_at` tanpa syarat, jadi request yang sudah
  diputus terus bertambah tiap load.
- **Fix DB:** migrasi baru `20260714000300_approval_waiting_hours_freeze.sql`
  → `coalesce(resolved_at, now()) - created_at` (bekukan saat resolusi; request
  aktif tetap berjalan). `create or replace view` menyatakan ulang definisi
  view identik kecuali satu baris `waiting_hours`.
- **Fix UI:** detail panel me-relabel "Menunggu" → "Waktu keputusan" untuk
  request non-aktif; tabel hanya memberi warna merah ">24 jam" pada request yang
  masih aktif (bukan yang sudah diputus).

### Bug #3 — Paket expired masih tampil "active" ✅
- **Akar masalah:** `client_packages.status` = enum tersimpan yang di-set saat
  pembelian; tidak ada trigger/cron/derivasi yang membalik `active → expired`
  saat `expires_at` lewat. Manifest juga di mock (`mockClientPackages[0]`
  expires 2026-06-17, status active).
- **Fix:** helper domain murni `deriveClientPackageStatus(storedStatus,
  expiresAt, now)` (hanya override `active` → `expired` saat `expires_at < now`;
  status terminal lain apa adanya; strict `<` mengikuti guard DB). Diterapkan di
  display mapper `toClientPackageTableRow` (berlaku untuk mock & supabase).
  `StatusBadge` diberi tone `expired`→danger, `depleted`→warning.
- **Catatan:** filter status di repository (`.eq("status", ...)`) tetap pakai
  nilai tersimpan; tidak diubah karena page loader client-packages tidak
  mengirim filter status (jalur tak terpakai). Derivasi ada di lapisan display.

### Bug #2 — Angka "revenue bulan ini" tak konsisten antar-halaman ✅
- **Akar masalah:** tiga sumber berbeda — Overview (payments, bulan kalender
  nyata → Rp0 karena seed Juni), Financials (`financial_entries` income ledger,
  window = bulan entri terbaru → ~Rp8,5jt), Catalog (string hardcoded
  `Rp 72.540.000`).
- **Fix:**
  - **Loader kanonik baru** `lib/revenue/current-month-revenue.ts`
    (`loadCurrentMonthRevenueIdr`) — sum payments lunas bulan kalender berjalan;
    definisi sama persis dengan Overview; `null` saat mock/error.
  - **Catalog:** KPI "Revenue (MTD)" tak lagi hardcoded; ambil dari loader
    kanonik (fallback "—" saat unavailable), trend palsu "18% vs bulan lalu"
    dibuang.
  - **Financials:** `referenceDate` diselaraskan ke tanggal nyata (`new Date()`)
    bukan tanggal entri terbaru, jadi "Bulan ini" = bulan kalender sungguhan.
  - **Overview:** tidak diubah (sudah kanonik).
- **Konsekuensi jujur:** dengan seed Juni & "sekarang" Juli, Overview & Catalog
  bisa Rp0 dan Financials "Bulan ini" bisa kosong — konsisten dan jujur.

## Gate verifikasi (semua HIJAU)
```
npx --yes pnpm@11.3.0 --dir packages/domain test   # 151 (+5)
npx --yes pnpm@11.3.0 --dir apps/web test          # 272 (+5)
npx --yes pnpm@11.3.0 --dir packages/domain typecheck  # clean
npx --yes pnpm@11.3.0 --dir apps/web typecheck     # clean
npx --yes pnpm@11.3.0 --dir apps/web lint          # clean
npx --yes pnpm@11.3.0 --dir apps/web build         # ok (semua route ter-compile)
```

## Belum diverifikasi / langkah manual
- **Migrasi `20260714000300`** belum diterapkan ke DB manapun. Terapkan via
  `supabase db reset` (lokal) / `supabase db push` (remote) sebelum efek bug #4
  terlihat di supabase mode.
- **e2e Playwright** tidak bisa jalan di shell non-interaktif ini: `webServer`
  memanggil `corepack` yang tidak ada di PATH (batasan environment, bukan kode).
  Build + unit menutupi logika; verifikasi browser langsung = langkah manual
  (lihat [[preview-via-active-browser]]).
- **Belum di `main`, belum push, belum deploy.**

## Lanjut berikutnya
Opsi tersisa di `LATEST.md`: SP2-b (Live Chat draft), grounding data
operasional, atau merge `phase-audit-fixes` → `main` + deploy (terapkan migrasi
DB dulu).
