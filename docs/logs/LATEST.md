# LATEST — Resume Pointer (baca ini dulu di sesi baru)

> Snapshot "di mana kita sekarang & cara lanjut". **Selalu ditimpa** tiap pembaruan signifikan.
> Detail kronologis ada di `docs/logs/{update}_{date}_log.md`; detail per-fase di `docs/PHASE_*_LOG.md`.

- **Terakhir diperbarui:** 2026-07-14
- **Branch aktif:** `phase-approval-backend` (tip `839885a`)
- **Log update terbaru:** [`rag-and-business-agent_2026-07-14_log.md`](rag-and-business-agent_2026-07-14_log.md)

## Kondisi terkini (apa yang SUDAH selesai)
- **Approval backend** (branch dasar `phase-approval-backend`, dari sebelumnya).
- **SP1 — RAG Knowledge Ingestion** (Knowledge Studio): upload Excel/CSV/PDF/JPG/PNG → ekstrak → review → embed (pgvector) → publish → Test Lab retrieval. LIVE di `/settings/ai-management/knowledge-studio`. Sudah **merged** ke `phase-approval-backend`.
- **SP2a — AI Business Agent** (Q&A internal dari knowledge base, read-only, scope-limited, audited). LIVE di `/settings/ai-management/business-agent`. Sudah **merged** ke `phase-approval-backend`.
- Semua gate hijau: domain 146, web 267, typecheck, lint, next build, e2e (knowledge-studio + ai-business-agent).

## Yang BELUM / titik lanjut berikutnya (pilih salah satu)
1. **SP2-b: Live Chat draft balasan customer** — customer-facing, approval-gated, butuh WhatsApp (belum tersambung). Spec terpisah.
2. **Grounding data operasional** untuk Business Agent — appointments/clients/finance ringkas, tiap sumber sensitif butuh permission gate + masking.
3. **Perbaikan temuan audit** (belum dikerjakan): tombol "Create Request" di Approval Center no-op; inkonsistensi angka "revenue bulan ini" antar-halaman (Overview Rp0 vs Financials Rp8,5jt vs Catalog Rp72,5jt); status paket expired masih "active"; timer "Menunggu" jalan di approval yang sudah diputus.
4. **Merge `phase-approval-backend` → `main` + deploy** (lihat catatan deploy di bawah).

## Cara lanjut / jalankan
- **Mock mode (default, tanpa DB):** `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock` → hanya UI/preview; orchestrator kembalikan `configuration_error` (pipeline butuh supabase mode).
- **Supabase mode (fitur nyata):** Docker Desktop ON → `./node_modules/.bin/supabase.CMD start` → `... db reset` (menerapkan 4 migrasi baru: 2 SP1 `20260713*`, 2 SP2 `20260714*`). Set `apps/web/.env.local`: `HOM_DATA_MODE=supabase`, `HOM_AUTH_MODE=supabase`. Jalankan dev; login seeded `local.studio.director@example.invalid` (password ada di `supabase/seed.sql`; **user yang ketik password**, assistant tak boleh).
- **pnpm TIDAK di PATH** di shell non-interaktif → pakai `npx --yes pnpm@11.3.0 --dir apps/web <script>`; migrasi via `./node_modules/.bin/supabase.CMD`.

## Catatan penting
- **AI masih mode MOCK** — belum ada `OPENAI_API_KEY` di env repo. Retrieval/DB/RBAC/audit semua nyata; hanya kualitas embedding+jawaban yang mock. Tambah `OPENAI_API_KEY` ke `apps/web/.env.local` = AI beneran tanpa ubah kode. **OpenRouter TIDAK bisa** untuk inti RAG (tak ada endpoint embeddings); alternatif gratis = Gemini (perlu adapter baru).
- **Belum di `main`, belum deploy.** Deploy: push `main` auto-deploy KODE, tapi **migrasi DB TIDAK auto-apply** — terapkan 4 migrasi ke DB prod dulu.
- Follow-up terdokumentasi: lihat `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md` (§Known follow-ups) & `docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md`.
