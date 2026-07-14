# LATEST — Resume Pointer (baca ini dulu di sesi baru)

> Snapshot "di mana kita sekarang & cara lanjut". **Selalu ditimpa** tiap pembaruan signifikan.
> Detail kronologis ada di `docs/logs/{update}_{date}_log.md`; detail per-fase di `docs/PHASE_*_LOG.md`.

- **Terakhir diperbarui:** 2026-07-14
- **Branch aktif:** `phase-audit-fixes` (off `main`; `phase-approval-backend` sudah di-fast-forward ke `main`). **Sudah di-push ke `origin`; PR dibuka ke `main`** (base `main` = origin masih di `fb8a126`, jadi PR memuat SELURUH backlog RAG/SP2a/approval + 4 fix = 59 commit, 10 migrasi).
- **Log update terbaru:** [`audit-fixes_2026-07-14_log.md`](audit-fixes_2026-07-14_log.md)

## Kondisi terkini (apa yang SUDAH selesai)
- **Approval backend + SP1 RAG + SP2a Business Agent** — semua sudah di `main` (main = tip `phase-approval-backend`, di-ff-merge). Lihat [`rag-and-business-agent_2026-07-14_log.md`](rag-and-business-agent_2026-07-14_log.md).
- **Perbaikan temuan audit (data honesty)** di branch `phase-audit-fixes`:
  - Bug #4: timer "Menunggu" dibekukan saat resolusi (migrasi `20260714000300` + relabel UI).
  - Bug #3: paket expired kini tampil "expired" (helper domain `deriveClientPackageStatus` di display mapper).
  - Bug #2: "revenue bulan ini" satu sumber kanonik = payments lunas bulan berjalan (loader baru; Catalog tak lagi hardcoded; Financials month-window diselaraskan).
  - Bug #1: tombol "Create Request" sengaja dibiarkan placeholder (keputusan user).
- Gate hijau: domain 151, web 272, typecheck, lint, next build. (e2e Playwright terblokir corepack PATH.)
- **Migrasi `20260714000300` sudah diverifikasi di DB LOKAL** (2026-07-14): `create or replace view` sukses; uji sintetis membuktikan row terputus beku (40h→10h di titik resolusi) sementara row aktif tetap jalan (5h→5h). **Belum diterapkan ke staging/prod.**

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
- **`phase-audit-fixes` belum di-merge ke `main`, belum deploy** (branch sudah di-push, PR ke `main` terbuka). Deploy: merge/push `main` auto-deploy KODE, tapi **migrasi DB TIDAK auto-apply** — terapkan migrasi ke DB prod dulu.

### Langkah apply migrasi ke DB PROD (lakukan SEBELUM merge PR ke `main`)
Karena `origin/main` masih tertinggal, saat PR ke `main` di-merge, SEMUA migrasi berikut harus sudah ada di DB prod (urut timestamp, forward-only):
`20260608000100/200/300/400`, `20260705000100`, `20260713000100/200`, `20260714000100/200/300`.

```bash
# 1) Link sekali ke project Supabase prod (butuh DB password prod — KAMU yang ketik, jangan di-commit)
./node_modules/.bin/supabase.CMD link --project-ref <PROJECT_REF_PROD>

# 2) Lihat migrasi yang belum diterapkan di remote (dry check)
./node_modules/.bin/supabase.CMD migration list --linked

# 3) Terapkan migrasi yang belum ada ke prod (forward-only, TIDAK menghapus data)
./node_modules/.bin/supabase.CMD db push --linked

# 4) Verifikasi view waiting-hours sudah ter-fix di prod
#    (jalankan di SQL editor Supabase / psql prod):
#    select pg_get_viewdef('private.approval_request_rows'::regclass) ilike '%coalesce%resolved_at%';  -- harus true
```
Setelah `db push` sukses + terverifikasi, baru merge PR ke `main` (push = auto-deploy Vercel).
**Aturan keamanan:** password DB prod & `PROJECT_REF` bukan untuk di-commit; assistant tidak boleh mengetik kredensial — user yang input.
- Follow-up terdokumentasi: lihat `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md` (§Known follow-ups) & `docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md`.
