# Phase UX-3 — Final Review & Verification Log (FASE 5)

Review akhir seluruh diff branch `phase-approval-backend` vs `main`
(30 file, +3.584/−135): approval backend (4 migrasi + wiring TS) + batch
UX-1 (frontend honesty) + UX-2 (M1 dual sign-off, M2 honest errors) + a11y +
perbaikan spec e2e.

## Metode

- Code review 8 sudut (line-by-line, removed-behavior, cross-file tracer,
  reuse, simplification, efficiency, altitude, conventions/AGENTS.md) oleh
  agent independen paralel → ±36 kandidat → dedup → verifikasi terhadap kode
  aktual → **10 temuan** dilaporkan (ranking terberat dulu).
- Security pass sebelumnya (FASE 1) atas approval backend: RLS/RPC/SoD bersih;
  review final menegaskan ulang — **paritas guard migrasi dual sign-off vs
  versi sebelumnya diverifikasi dua agent independen: tidak ada guard hilang,
  tidak ada jalur bypass single-actor** (jalur restart need_more_info/escalate
  ditelusuri; clobber approver_id oleh escalate tidak bisa dipakai first-signer
  untuk counter-sign karena cek hanya berlaku saat status tepat
  awaiting_second_approval).

## Gate verifikasi final (state HEAD `c8e515b`)

| Gate | Hasil |
|---|---|
| `typecheck` | ✅ domain + web |
| `lint` | ✅ 0 error 0 warning |
| `test` (vitest) | ✅ domain 123 + web 245 |
| `test:e2e` (mode mock) | ✅ 30 pass / 5 skip guarded |
| `build-storybook` | ✅ |
| Verifikasi SQL dual sign-off (Supabase lokal, psql impersonation, rollback) | ✅ 7 skenario |

## Temuan review final (10 — lihat laporan findings; ringkasan kelas)

1. **Sisa ketidakjujuran data** (kelas yang sama dengan yang batch ini
   perbaiki, terlewat): banner "(mock — local-state only)" di modal approve
   dual-sign; fallback seed mock untuk Approval Rules saat gagal/kosong di mode
   supabase; empty-state palsu di roster /clients saat load gagal.
2. **Gap integrasi UI dual sign-off**: filter status tanpa opsi
   `awaiting_second_approval`; toast menampilkan enum mentah; target eskalasi
   tidak pernah dikirim ke backend (modal mengumpulkan label peran, bukan user
   id) → guard SECOND_APPROVAL_INVALID_APPROVER tak terjangkau dari UI.
3. **Kebenaran-di-skala**: KPI /clients kena cap 1000 baris PostgREST; kartu
   "Aktif" katalog dihitung dari baris halaman tapi berlabel global; worklist
   approval terpotong diam-diam di 200; biaya view approval (subquery
   berkorelasi sebelum LIMIT) di ribuan request.

Tak satu pun temuan berupa vuln keamanan exploitable; mayoritas adalah
kejujuran-data lanjutan dan integrasi UI fitur dual sign-off.

## Temuan tier-2 (tercatat, tidak masuk 10 besar)

Rounding `waiting_hours` menggeser batas >24 jam ±30 menit; mock mode tidak
memodelkan rantai dual sign-off (approve 1 langkah); `selectedId` tidak
direkonsiliasi saat klien pertama dibuat; `actionPending` tidak pernah
dirender (tanpa loading state di modal); baris basi setelah toast kegagalan
(revalidate hanya saat sukses); `asStatus`/`asRisk` meng-coerce nilai tak
dikenal jadi default; bucket bulan pakai UTC (konvensi lama codebase, bukan
regresi); assertion e2e RBAC create-button terhapus tanpa pengganti;
duplikasi monthKey/fake-client-test/summary-catalog; ClientsCatalogPage kini
Storybook-only; error card approvals tidak memakai komponen ErrorState;
pin env mock di playwright.config webServer (fix satu baris utk flake mode);
load data /approvals berjalan sebelum gate permission (kerja sia-sia saat
akses ditolak); saran altitude: state machine dual sign-off eksplisit +
tabel approval_signatures saat side-effect nyata dibangun.

## Risiko sisa

- Temuan di atas **belum diperbaiki** — menunggu pilihan owner.
- Migrasi `20260705000100` baru terpasang di Supabase LOKAL; staging/prod
  belum (langkah manual owner).
- Suite e2e butuh override `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock` di mesin
  dev (`.env.local` = supabase) sampai env di-pin di playwright.config.
- i18n belum ada (temuan Low FASE 1) — teks campur EN/ID.

## Langkah manual owner

1. Pilih temuan review final mana yang mau diperbaiki sebelum merge
   (rekomendasi minimum: 3 item kejujuran-data #1 — cepat, sekelas dengan yang
   sudah dikerjakan; dan filter status + toast enum karena menyempurnakan M1).
2. Apply migrasi `20260705000100_approval_dual_sign_off.sql` ke Supabase
   remote (`supabase db push`, forward-only) SEBELUM merge/push ke `main`
   (push = auto-deploy Vercel; migrasi tidak auto-apply).
3. Merge/push adalah keputusanmu — tidak dilakukan oleh sesi ini.

## Drift dokumen

`CLAUDE.md` hom_v2 masih akurat (stack, aturan, cara jalan). Baris status
"Pre-MVP / scaffolding aktif" sudah tertinggal dari kenyataan (MVP operasional
+ soft-launch demo env sudah jalan) — usul pembaruan kecil, menunggu approve.
