# Phase UX-1 — Frontend Data Honesty Log

Batch dari audit FASE 1 (lihat `PHASE_UX1_FRONTEND_HONESTY_PLAN.md`): C1 + H1 + H2.
Frontend-only; tanpa perubahan skema, migrasi, RPC, atau dependency baru.

## Perubahan

### C1 — Landing `/` kini cockpit data-nyata
- `apps/web/src/app/page.tsx`: render `ExecutiveOverviewPage` (loader Supabase nyata:
  KPI, grafik Pendapatan vs Klien Baru, "Perlu perhatian", AI Demo Summary; state
  jujur `ready`/`empty`/`unavailable`) menggantikan `DecisionOverviewPage` yang
  seluruh angkanya hardcoded tanpa label contoh.
- `DecisionOverviewPage` + `features/overview/*` TIDAK dihapus — hanya tidak lagi
  dipasang di `/`. Kandidat lanjutan: suapi layout kaya-nya dengan data nyata.
- Efek samping baik: spec e2e `renders /` (expect heading "Strategic Overview")
  kini lulus — sebelumnya gagal.

### H1 — String "(mock)" dihapus dari Approval Center
`apps/web/src/features/approvals/approvals-page.tsx`:
- KPI helper `"disetujui (mock)"` → `"total disetujui"`.
  Catatan: sengaja BUKAN "disetujui bulan ini" karena `computeApprovalKpis`
  menghitung SEMUA request approved, bukan per bulan — label harus jujur.
  Follow-up kecil: field `approvedThisMonth` di `approval-helpers.ts` sebaiknya
  di-rename (mis. `approvedTotal`) agar tidak menyesatkan.
- Toast export → `"Ekspor antrean persetujuan belum tersedia."`
- Toast create → `"Pembuatan request manual segera hadir."`

### H2 — Bahasa bisnis di halaman katalog
Mengikuti pola Appointments (nilai "—" saat belum termuat; tanpa jargon):
- `features/catalog/services/services-catalog-page.tsx` (dipasang di `/services`):
  "Total Layanan / Layanan Aktif / Ditampilkan"; empty state "Belum ada layanan".
- `features/packages/packages/packages-page.tsx` (dipasang di `/packages`):
  "Total Paket / Paket Aktif / Ditampilkan"; empty state "Belum ada paket".
- `features/catalog/clients/clients-catalog-page.tsx`: sama ("Total Klien / Klien
  Aktif / Ditampilkan") — NAMUN lihat temuan baru di bawah: komponen ini ternyata
  hanya dipakai Storybook; `/clients` memasang `ClientManagementPage`.

## Verifikasi (bukti)

| Gate | Hasil |
|---|---|
| `corepack pnpm typecheck` | ✅ pass (domain + web) |
| `corepack pnpm lint` | ✅ pass (0 error) |
| `corepack pnpm test` | ✅ pass — domain 123, web 235 |
| `corepack pnpm build-storybook` | ✅ pass |
| `corepack pnpm test:e2e` | ⚠️ 27 pass / 3 fail / 5 skip — ketiga kegagalan PRE-EXISTING (bukti di bawah) |

### Bukti e2e failure = pre-existing, bukan regresi batch ini
1. Dengan perubahan di-`git stash` (tree bersih), spec `renders /` gagal identik →
   suite sudah merah sebelum batch ini.
2. Akar masalah #1 (environment): `.env.local` berisi `HOM_AUTH_MODE=supabase` +
   `HOM_DATA_MODE=supabase`, sementara 30 spec mock butuh mode mock → semua halaman
   redirect ke "Studio sign in". Workaround yang dipakai (tanpa ubah config):
   `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock corepack pnpm test:e2e`
   (process env menang atas `.env.local` di Next.js).
3. Akar masalah #2 (spec basi vs UI revamp), tersisa 3 setelah mode dibetulkan:
   - `renders /clients` — spec expect heading `"Clients"`; halaman kini
     `"Client Management"`.
   - `renders /financials` — spec expect `"Financials"`; kini `"Financial Overview"`.
   - `renders repository-fed mock clients…` — expect tabel katalog lama
     ("Mock Client Alpha"); halaman kini ClientManagementPage.
   Perbaikan spec menunggu keputusan owner (heading mana yang kanonik) — belum
   diubah di batch ini.

## Temuan BARU selama verifikasi (belum dikerjakan — butuh keputusan)

**C1-b: Fabricated data lebih luas dari `/`.** `/clients` memasang
`ClientManagementPage` yang mencampur tabel klien NYATA (`loadRealManagedClients`)
dengan KPI + "AI Insight" HARDCODED dari
`features/clients/management/management-data.ts` ("Total Clients 1.248",
"Active Members 184", "At-Risk 23", potensi Rp 12.750.000, dst — tanpa label
contoh). Pola serupa di `clients/leads`, `clients/segments`, `clients/tags`
(`*-data.ts`). Opsi: (a) hitung KPI dari data nyata, (b) sembunyikan baris KPI +
AI insight sampai nyata, (c) label "contoh data". Perlu keputusan owner.

## C1-b — `/clients` jujur (lanjutan, disetujui owner: opsi a)

Perubahan (4 file):
- BARU `features/clients/management/management-kpis-loader.ts` — satu select ringan
  `status,created_at` ke `clients` → `totalClients / activeClients /
  newClientsThisMonth / prospectClients`; gagal → `null` (bukan nol palsu).
- `app/clients/page.tsx` — muat KPI + kirim `dataSource`.
- `client-management-page.tsx` — mode supabase: (1) KPI dari loader (4 kartu jujur;
  "—" saat null; kartu At-Risk/VIP/Expiring yang tak bisa dihitung TIDAK ditampilkan),
  (2) tabel = klien database saja (seed fiktif hanya fallback mode mock, pola
  ApprovalsPage), (3) strip "AI Insight Hari Ini" hardcoded disembunyikan (ringkasan
  AI nyata ada di Overview), (4) guard empty state tabel + panel detail.
- BARU `tests/unit/clients/management-kpis-loader.test.ts` — 4 test (agregat,
  error→null, throw→null, tanggal malformed).

Verifikasi C1-b:
- typecheck ✅ · lint ✅ (0 error 0 warning) · vitest domain 123 + web 239 ✅ ·
  build-storybook ✅ · e2e mock: 27 pass / 3 fail pre-existing yang sama / 5 skip
  (mode mock tak berubah perilaku — seed & KPI lama tetap dipakai di mock).
- Verifikasi browser (localhost:3000, Supabase Docker lokal, mode supabase):
  `/clients` menampilkan KPI nyata (Total 40 · Aktif 23 · Baru bulan ini 0 ·
  Prospek 9), tanpa strip AI Insight, tabel hanya klien database; `/` menampilkan
  Strategic Overview cockpit dengan KPI & grafik nyata (mis. pending 12 ·
  Rp 22,9 jt).
- Catatan alat: `.next` sempat korup (validator.ts) karena dev server e2e terbunuh
  paruh jalan → typecheck gagal palsu; solusi hapus `apps/web/.next` (cache).

## Caveat
- Perubahan `clients-catalog-page.tsx` saat ini hanya berefek ke Storybook
  (komponen tidak dipasang di rute mana pun) — tetap dipertahankan agar konsisten
  bila dipasang lagi.
- E2E suite di mesin ini WAJIB dijalankan dengan override env mock (lihat atas).
- 3 spec e2e basi masih merah — pre-existing, menunggu keputusan heading kanonik.

## Commit
- `ui: point / at real executive overview cockpit`
- `ui: remove visible "(mock)" strings from approval center`
- `ui: replace developer jargon with business language on catalog pages`
- `docs: add phase UX-1 plan + log`
(hash diisi setelah commit — lihat riwayat git branch `phase-approval-backend`)
