# Update Log — RAG Knowledge Ingestion (SP1) + AI Business Agent (SP2a)

- **Tanggal:** 2026-07-14
- **Branch:** `phase-approval-backend` (kedua fitur sudah di-merge, fast-forward)
- **Tip setelah update:** `839885a`

## Ringkasan (apa yang berubah)

### SP1 — RAG Knowledge Ingestion (Knowledge Studio)
Mengganti placeholder "Segera hadir" + memperbaiki CTA "Review knowledge" yang buntu.
- Upload Excel/CSV/PDF/JPG/PNG → simpan (Supabase Storage privat) → ekstrak (SheetJS / unpdf / OpenAI vision) → review owner → chunk + embed (pgvector `vector(1536)`) → publish → **Test Lab** retrieval (cosine `<=>`, scope-filtered) + policy guard.
- AI Gateway (`apps/web/src/lib/ai/gateway`): alias + adapter OpenAI + fallback mock deterministik (jalan tanpa API key).
- Semua write via RPC `SECURITY DEFINER` (auth+RBAC+audit). Migrasi `20260713000100` (tabel+pgvector+RLS+bucket) & `20260713000200` (RPC create/extract/fail/publish/match).
- 20 task TDD (subagent-driven), review final bersih. Verifikasi live end-to-end di supabase mode (upload→publish→Test Lab menemukan chunk).
- Detail: `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md`, spec `docs/superpowers/specs/2026-07-13-rag-knowledge-ingestion-design.md`.

### SP2a — AI Business Agent (Q&A internal)
Mengganti placeholder Business Agent → asisten internal read-only.
- Owner/staff tanya → jawaban HANYA dari knowledge base yang dipublish, **dibatasi per-scope sesuai izin** (`allowedKnowledgeScopes(permissions)`), RBAC `can_use_ai_business_agent`, policy guard, di-audit (`record_ai_interaction`).
- Migrasi `20260714000100` (audit RPC + perlebar gate match) & `20260714000200` (**ACL scope di DB** — fix keamanan dari review final: `match_knowledge_chunks` interseksi scope caller dgn scope yang diizinkan izinnya, jadi panggilan RPC langsung via PostgREST tak bisa bypass filter app-layer).
- 5 task TDD + review final. Reuse penuh retrieval SP1.
- Detail: `docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md`, spec `docs/superpowers/specs/2026-07-14-ai-business-agent-knowledge-qa-design.md`.

## Cara verifikasi (gate — semua HIJAU)
```
npx --yes pnpm@11.3.0 --dir packages/domain test   # 146/146
npx --yes pnpm@11.3.0 --dir apps/web test          # 267/267
npx --yes pnpm@11.3.0 --dir apps/web typecheck     # clean
npx --yes pnpm@11.3.0 --dir apps/web lint          # clean
npx --yes pnpm@11.3.0 --dir apps/web build         # ok
npx --yes pnpm@11.3.0 --dir apps/web test:e2e -- knowledge-studio   # 2/2
npx --yes pnpm@11.3.0 --dir apps/web test:e2e -- ai-business-agent  # 1/1
```
Live browser E2E (supabase mode, mock AI): login studio_director → Knowledge Studio upload/publish + Test Lab retrieval OK; Business Agent Q&A OK. Security: principal `ai_agent_service`-only diblok dari scope finance/owner_only via raw RPC (=0), owner tetap dapat (=1).

## Status & follow-up
- **Belum di `main`, belum deploy.** 4 migrasi baru harus diterapkan ke DB prod sebelum/saat deploy (migrasi tidak auto-apply).
- **AI masih mock** (belum ada `OPENAI_API_KEY`).
- Follow-up terdokumentasi ada di kedua PHASE log (mis. SP1: OCR PDF scan, cleanup storage orphan, unify SUPPORTED_MIME, test happy-path orchestrator; SP2: tighten test exclusion, hoist getGatewayMode, dsb).

## Lanjut berikutnya
Lihat `docs/logs/LATEST.md` → opsi: SP2-b (Live Chat draft), grounding data operasional, perbaikan temuan audit, atau merge ke main + deploy.
