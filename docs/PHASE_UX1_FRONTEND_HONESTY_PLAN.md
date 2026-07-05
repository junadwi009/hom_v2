# Phase UX-1 — Frontend Data Honesty Plan

> Scope batch dari FASE 1 audit: **C1 (Overview jujur)** + **H1 (buang "(mock)" di Approvals)** +
> **H2 (buang jargon developer di katalog)**. Semua frontend-only, tanpa perubahan skema /
> migrasi / RPC. Tujuan: hilangkan data palsu & istilah yang menurunkan kepercayaan di depan
> owner/investor, tetap dalam design system yang ada (shadcn/Radix + design token), tanpa
> dependency baru.

## Kenapa batch ini dulu
Audit backend (lama + approval) terverifikasi bersih — tidak ada security Critical/High. Semua
temuan Critical/High justru di frontend "kejujuran data". FASE 4 repo juga bilang: **kejujuran
data dulu, baru polish**. Batch ini dampak owner paling besar, risiko paling kecil.

---

## C1 — Landing `/` pakai cockpit data-nyata (bukan fabricated)

**Masalah:** `app/page.tsx` merender `DecisionOverviewPage`, yang seluruh angkanya hardcoded
(`features/overview/overview-data.ts:1` → `// Presentational mock data`) dan **tanpa label
"contoh"**. Owner membaca angka fiksi sebagai fakta.

**Fakta kunci:** cockpit jujur **sudah jadi** di `features/executive-command/`
(`ExecutiveOverviewPage` → `loadExecutiveOverview`): KPI nyata, grafik "Pendapatan vs Klien
Baru per Bulan", "Perlu perhatian" nyata, AI Demo Summary nyata, plus state `ready` / `empty`
(mode mock → "—") / `unavailable` (gagal load). Ini persis permintaan OWNER_Review P1.

**Perubahan:**
1. `apps/web/src/app/page.tsx` — render `ExecutiveOverviewPage` (dari
   `@/features/executive-command/executive-overview-page`) menggantikan `DecisionOverviewPage`.
   Pertahankan `export const dynamic = "force-dynamic"`.
2. `DecisionOverviewPage` + `overview-data.ts` + widget `features/overview/*` **dibiarkan ada
   tapi tidak dipakai** (tidak dihapus — aturan safety). Ditandai sebagai kandidat kerja lanjutan
   (feed data nyata ke layout kaya-nya) atau dihapus **hanya bila kamu minta eksplisit**.
3. `/dashboard/executive-command` dibiarkan apa adanya (komponen sama). Tidak ada duplikasi
   data palsu; paling-paling dua rute menampilkan cockpit yang sama — aman. (Opsi alternatif:
   `/dashboard/executive-command` redirect ke `/` — tunggu preferensimu, default: biarkan.)

**Open question (butuh keputusanmu):**
- Q1: `DecisionOverviewPage` (layout lebih kaya: lead funnel, revenue mix, member risk, AI panel)
  — dibiarkan sebagai dead code untuk digarap nanti dengan data nyata, atau kamu mau aku
  hapus? (Default rekomendasi: **biarkan**, garap nanti saat sumber data lead/risk ada.)

---

## H1 — Buang "(mock)" yang tampil di Approval Center
**File:** `apps/web/src/features/approvals/approvals-page.tsx` (~baris 232, 246, 249).
- `helper: "disetujui (mock)"` → `"disetujui"` (atau metrik nyata bila tersedia dari
  `initialRequests`; minimal buang kata "mock").
- Toast `"Export approval queue (mock)."` → `"Ekspor antrean persetujuan belum tersedia."`
- Toast `"Pembuatan request manual menyusul (mock)."` → `"Pembuatan request manual segera hadir."`

## H2 — Ganti jargon developer di halaman katalog nyata
**File:** `clients-catalog-page.tsx`, `services-catalog-page.tsx`, `packages/packages-page.tsx`.
- `helper="repository result"` / `"local workspace"`, `trend="read-only"/"not loaded"`,
  `label="Visible rows"`, empty "The read-only catalog returned no records…" → bahasa bisnis,
  mengikuti pola yang **sudah** dipakai Appointments (`appointments-catalog-page.tsx:109–123`,
  mis. "Total klien", "Ditampilkan", "Belum ada data untuk periode ini").
- Tanpa mengubah logika/loader — hanya string tampilan.

---

## Cara test / verifikasi (tiap perubahan)
- `corepack pnpm typecheck` + `corepack pnpm lint` — hijau.
- `corepack pnpm --dir apps/web test` (vitest) — hijau; sesuaikan bila ada unit test yang
  meng-assert konten Overview lama.
- `corepack pnpm --dir apps/web test:e2e` (playwright, mode mock) — hijau. Perhatian: di mode
  mock, `/` kini tampil state **empty jujur** ("—", "Menunggu data studio"), bukan angka palsu —
  update `app-shell.spec.ts` bila ia meng-assert teks Overview lama.
- `corepack pnpm --dir apps/web build-storybook` — hijau (story `decision-overview-page.stories`
  tetap ada karena komponennya tidak dihapus).
- Verifikasi visual via browser lokal (Claude in Chrome, localhost:3000) sesuai memory:
  `/` menampilkan Strategic Overview cockpit; tidak ada angka fiksi; tidak ada "(mock)"/jargon.

## Acceptance criteria
- `/` = cockpit data-nyata; saat data ada → KPI + grafik nyata; saat kosong/gagal → state jujur
  (bukan nol/angka palsu).
- Tidak ada string "(mock)" atau "repository/local workspace/read-only/not loaded/Visible rows"
  yang tampil ke user di Approvals & katalog.
- Semua quality gate hijau. Tidak ada perubahan skema/RPC. Tidak ada dependency baru.

## Di luar scope batch ini (menyusul, batch lain)
- M1/M2 governance approval (backend, TDD), M3 + a11y, L1 i18n, L2 mock-data.ts cleanup.

## Commit plan (atomic, kecil)
1. `ui: point / at real executive overview cockpit` (C1).
2. `ui: remove visible "(mock)" strings from approval center` (H1).
3. `ui: replace developer jargon with business language on catalog pages` (H2).
