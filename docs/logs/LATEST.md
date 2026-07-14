# LATEST — Resume Pointer (baca ini dulu di sesi baru)

> Snapshot "di mana kita sekarang & cara lanjut". **Selalu ditimpa** tiap pembaruan signifikan.
> Detail kronologis ada di `docs/logs/{update}_{date}_log.md`; detail per-fase di `docs/PHASE_*_LOG.md`.

- **Terakhir diperbarui:** 2026-07-14
- **Branch aktif:** `phase-audit-fixes` (off `main`; `phase-approval-backend` sudah di-fast-forward ke `main`)
- **Log update terbaru:** [`audit-fixes_2026-07-14_log.md`](audit-fixes_2026-07-14_log.md)

## Kondisi terkini (apa yang SUDAH selesai)
- **Approval backend + SP1 RAG + SP2a Business Agent** — semua sudah di `main` (main = tip `phase-approval-backend`, di-ff-merge). Lihat [`rag-and-business-agent_2026-07-14_log.md`](rag-and-business-agent_2026-07-14_log.md).
- **Perbaikan temuan audit (data honesty)** di branch `phase-audit-fixes`:
  - Bug #4: timer "Menunggu" dibekukan saat resolusi (migrasi `20260714000300` + relabel UI).
  - Bug #3: paket expired kini tampil "expired" (helper domain `deriveClientPackageStatus` di display mapper).
  - Bug #2: "revenue bulan ini" satu sumber kanonik = payments lunas bulan berjalan (loader baru; Catalog tak lagi hardcoded; Financials month-window diselaraskan).
  - Bug #1: tombol "Create Request" sengaja dibiarkan placeholder (keputusan user).
- Gate hijau: domain 151, web 272, typecheck, lint, next build. (Migrasi `20260714000300` belum diterapkan ke DB; e2e Playwright terblokir corepack PATH.)

## Yang BELUM / titik lanjut berikutnya (pilih salah satu)
1. **SP2-b: Live Chat draft balasan customer** — customer-facing, approval-gated, butuh WhatsApp (belum tersambung). Spec terpisah.
2. **Grounding data operasional** untuk Business Agent — appointments/clients/finance ringkas, tiap sumber sensitif butuh permission gate + masking.
3. **Fitur "Create Request" manual** di Approval Center (kalau diprioritaskan): form + server action + RPC SECURITY DEFINER + audit.
4. **Merge `phase-audit-fixes` → `main` + deploy** — terapkan migrasi `20260714000300` (dan 4 migrasi SP1/SP2) ke DB prod dulu; push `main` auto-deploy KODE saja.

## Cara lanjut / jalankan
- **Mock mode (default, tanpa DB):** `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock` → hanya UI/preview; orchestrator kembalikan `configuration_error` (pipeline butuh supabase mode).
- **Supabase mode (fitur nyata):** Docker Desktop ON → `./node_modules/.bin/supabase.CMD start` → `... db reset` (menerapkan 4 migrasi baru: 2 SP1 `20260713*`, 2 SP2 `20260714*`). Set `apps/web/.env.local`: `HOM_DATA_MODE=supabase`, `HOM_AUTH_MODE=supabase`. Jalankan dev; login seeded `local.studio.director@example.invalid` (password ada di `supabase/seed.sql`; **user yang ketik password**, assistant tak boleh).
- **pnpm TIDAK di PATH** di shell non-interaktif → pakai `npx --yes pnpm@11.3.0 --dir apps/web <script>`; migrasi via `./node_modules/.bin/supabase.CMD`.

## Catatan penting
- **AI masih mode MOCK** — belum ada `OPENAI_API_KEY` di env repo. Retrieval/DB/RBAC/audit semua nyata; hanya kualitas embedding+jawaban yang mock. Tambah `OPENAI_API_KEY` ke `apps/web/.env.local` = AI beneran tanpa ubah kode. **OpenRouter TIDAK bisa** untuk inti RAG (tak ada endpoint embeddings); alternatif gratis = Gemini (perlu adapter baru).
- **`phase-audit-fixes` belum di `main`, belum deploy.** Deploy: push `main` auto-deploy KODE, tapi **migrasi DB TIDAK auto-apply** — terapkan migrasi ke DB prod dulu (4 migrasi SP1/SP2 `20260713*`/`20260714*` + migrasi baru `20260714000300` waiting-hours-freeze).
- Follow-up terdokumentasi: lihat `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md` (§Known follow-ups) & `docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md`.
