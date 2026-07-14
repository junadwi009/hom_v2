# Phase SP2a: AI Business Agent — Internal Knowledge Q&A — Log

- **Spec:** `docs/superpowers/specs/2026-07-14-ai-business-agent-knowledge-qa-design.md` (Status: Implemented)
- **Builds on:** Sub-project 1 (RAG Knowledge Ingestion) — `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md`
- **Scope:** Sub-project 2a only — replaces the "Segera hadir" placeholder at `/settings/ai-management/business-agent` with a real, read-only internal Q&A assistant grounded in the **published** knowledge base. Does **not** touch Live Chat / WhatsApp customer-facing draft replies (that is SP2-b, a separate approval-gated spec).

This log is written for a beginner solo dev: what got built, in plain language, and how to run it locally.

## What was built

### 1. Database (one migration, additive/backward-compatible)
`supabase/migrations/20260714000100_ai_business_agent.sql`:
- **Widened `match_knowledge_chunks`** — re-created with the same body as SP1, only the permission gate changed: it now accepts `can_manage_knowledge OR owner OR can_use_ai_business_agent` (was `can_manage_knowledge OR owner`). This lets agent users who are *not* knowledge managers retrieve published chunks through the RPC. Table RLS is unchanged — the RPC does its own `SECURITY DEFINER` gating.
- **New `record_ai_interaction(p_action, p_target_id, p_metadata)`** — `SECURITY DEFINER` audit RPC. Gated to `can_use_ai_business_agent OR owner`. Validates `p_action` against a `namespace.verb` regex, then inserts one row into `audit_logs` (`target_type='ai_interaction'`, `risk_level='low'`). The metadata stores only source ids, the scope set, policy flags, latency/mode — **never the raw question or answer text**. `revoke ... from public, anon` + `grant execute ... to authenticated`, matching the existing RPC convention in this repo.

### 2. Domain (`packages/domain/src/knowledge/`)
- `access.ts` — `allowedKnowledgeScopes(permissions)`: a pure function mapping a user's permission list to the knowledge scopes they may retrieve from (see the safety-rule table below). Unit-tested for every gate.
- `businessAgentQueryInputSchema` (in `schemas.ts`) — Zod schema `{ question: string().min(3).max(500) }`. No scope field — scopes are always derived server-side from the user's permissions, never chosen by the client.
- Both exported from `packages/domain/src/knowledge/index.ts` (the existing barrel), consumed by `@hom/domain/knowledge`.

### 3. App layer (`apps/web/src/lib/ai/business-agent/`, `apps/web/src/features/ai-business-agent/`)
- `server/submit-business-agent-query.ts` (`server-only` orchestrator) — the full read path:
  `mode gate (supabase only) → getCurrentUser → RBAC (can_use_ai_business_agent) → Zod validate → allowedKnowledgeScopes → embedText → rpcMatch(scopes) → answerFromContext → evaluateKnowledgeAnswer (policy guard) → recordAiInteraction (best-effort) → return BusinessAgentQueryState`.
  Reuses `embedText`, `rpcMatch`, `answerFromContext`, `evaluateKnowledgeAnswer` unchanged from SP1 — no new gateway or retrieval code.
- `server/record-ai-interaction.ts` — thin wrapper around the `record_ai_interaction` RPC. A logging failure is swallowed (best-effort) so an audit hiccup never blocks the user from getting their answer.
- `features/ai-business-agent/query-business-agent-action.ts` (`"use server"`) — the `useActionState`-compatible action wrapper.
- `features/ai-business-agent/business-agent-action-types.ts` — the `BusinessAgentQueryState` union (`idle | configuration_error | auth_required | permission_denied | validation_error | error | success`), defined once and shared by the action and the chat UI.

### 4. UI (`apps/web/src/features/ai-business-agent/`)
- `ai-business-agent-page.tsx` — presentational: `PageHeader`, a "Mode preview (mock)" banner when `source==="mock"`, `PermissionDeniedState` when the user lacks `can_use_ai_business_agent`, otherwise a `DashboardCard` wrapping the chat.
- `ai-business-agent-chat.tsx` (`"use client"`) — a client-side transcript (not persisted server-side, per spec §2 "out of scope: multi-turn memory"). Each submitted question runs `queryBusinessAgentAction` via `useActionState`, then appends a turn (question, answer, sources, policy flags, mode badge) to local state.
- `apps/web/src/app/settings/ai-management/business-agent/page.tsx` replaces the old `ModuleMockPage` placeholder: resolves `getCurrentUser`, computes `canUse`, resolves `source` from `getDataMode()`, renders `AiBusinessAgentPage`.
- `ai-business-agent-page.stories.tsx` — Storybook states (mock banner, permission-denied, success with sources).

## The permission → knowledge-scope safety rule

`allowedKnowledgeScopes` (`packages/domain/src/knowledge/access.ts`) is the single place that decides what the AI is allowed to "see" for a given asker. The orchestrator always calls it and always passes its result to `rpcMatch` — the client can never choose or widen its own scopes.

| Scope | Included when… |
|---|---|
| `public_chatbot` | always (any user who reaches the orchestrator already holds `can_use_ai_business_agent`) |
| `internal_admin` | always |
| `marketing` | always |
| `finance` | user has `can_view_financials` |
| `clinical_safety` | user has `can_view_clinical_cases` |
| `owner_only` | user has `can_publish_knowledge` (concrete gate used in this implementation — see Deviations) |

Because the three base scopes are always included, the resulting scope set is never empty. If retrieval genuinely finds nothing relevant, the policy guard (`evaluateKnowledgeAnswer`, reused from SP1) returns the safe "no sources" fallback instead of letting the model guess.

## How to run this locally

1. Local Supabase must already have the SP1 knowledge tables/RPCs (`supabase/migrations/20260713*`) plus this phase's migration (`20260714000100_ai_business_agent.sql`) applied:
   ```bash
   ./node_modules/.bin/supabase.CMD db reset
   ```
2. In `apps/web/.env.local`:
   ```
   HOM_DATA_MODE=supabase
   HOM_AUTH_MODE=supabase
   ```
   (plus the usual `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` for local Docker Supabase.)
3. Optional: set `OPENAI_API_KEY` in `apps/web/.env.local` for real embeddings + answers. Without it, the AI Gateway falls back to the deterministic mock adapter — the whole flow still works end-to-end (retrieval, policy guard, audit row), just with canned/hashed output, and the chat shows a "Mode demo (tanpa OPENAI_API_KEY)" note per turn.
4. `corepack pnpm --dir apps/web dev` → log in as a user holding `can_use_ai_business_agent` (e.g. the seeded `studio_director`) → open `/settings/ai-management/business-agent` → ask a question grounded in a previously **published** SP1 knowledge source → confirm the answer cites sources and a new `audit_logs` row appears with `action='ai.business_agent.answered'`.
5. In `HOM_DATA_MODE=mock` (the default dev-server mode used for the e2e smoke below), the orchestrator short-circuits to `configuration_error` — the page still renders safely (heading + mode-preview banner + permission-denied or configuration message), it just never calls the DB/gateway.

## Out of scope (later sub-projects, per spec §2)

- **Live Chat customer-facing draft replies** (SP2-b) — a separate, approval-gated spec because it's customer-facing rather than an internal tool.
- **Grounding on operational data** (appointments/clients/finance/clinical records) — each such source needs its own permission gate + masking design before the agent can read it; today it only reads the published knowledge base.
- **Multi-turn memory / conversation persistence** — the chat transcript is client-side only; each turn is an independent retrieval with no follow-up-query rewriting or server-stored history.
- Full AI observability table / cost dashboards — this MVP logs to `audit_logs` only.

## Deviations from the spec

- **`owner_only` scope gate is concretely `can_publish_knowledge`.** The spec (§5) left this as "approximated by `can_manage_users` OR `can_publish_knowledge`, confirmed against the role→permission matrix in planning." In implementation, `can_publish_knowledge` alone was sufficient and simpler — it is the SP1 permission already used to gate publishing owner-only-scoped knowledge, so gating retrieval of that same scope on the same permission keeps the read/write symmetry obvious.
- **Audit is via the `record_ai_interaction` RPC**, exactly as planned (§6/§11) — no deviation, called out here because it's a spec "must" that's easy to silently drop; it is present and best-effort (a logging failure never blocks the answer).
- **Match-gate widened** to add `can_use_ai_business_agent` to `match_knowledge_chunks`'s existing `can_manage_knowledge OR owner` gate, exactly as planned (§6) — additive and backward-compatible; SP1's Test Lab callers are unaffected.
- **Chat state-append uses React "adjust state during render," not `useEffect`.** `ai-business-agent-chat.tsx` compares the latest `useActionState` result against a `processedState` ref-like state value and appends a turn synchronously during render when it changes, rather than in a `useEffect` after commit. This is the pattern React's own docs recommend for "state changed, react to it" cases — it avoids an extra render pass and keeps the turn-append atomic with the state transition.

## Security fix (post-review): DB-authoritative scope ACL

Final review found that `match_knowledge_chunks` trusted the caller-supplied `p_scopes` array with no DB-side restriction. Because the RPC is `SECURITY DEFINER`, granted to `authenticated`, and directly callable via PostgREST, a principal holding only `can_use_ai_business_agent` (e.g. the `ai_agent_service` role used for machine/service callers) could call it directly with `p_scopes=['finance','clinical_safety','owner_only']` and read sensitive published chunks — bypassing the app-layer `allowedKnowledgeScopes` gate entirely, since that gate only runs inside `submit-business-agent-query.ts`, not inside the RPC.

`supabase/migrations/20260714000200_knowledge_scope_acl.sql` closes this: the RPC now computes the caller's allowed scopes itself (mirroring `allowedKnowledgeScopes` — base `public_chatbot`/`internal_admin`/`marketing` always, plus `finance` if `can_view_financials`, `clinical_safety` if `can_view_clinical_cases`, `owner_only` if `can_publish_knowledge`), intersects that with the requested `p_scopes`, and filters chunks on the intersection (`ks.scopes && v_effective`) instead of on `p_scopes` directly. **The DB is now the authority; `allowedKnowledgeScopes` in the app layer is defense-in-depth, not the only gate.** Interactive roles that already hold all sensitive permissions (`super_admin`, `studio_director`) are unaffected — their retrieval is unchanged. Verified via psql impersonation; see `.superpowers/sdd/task-5-report.md` § "Fix: DB-authoritative scope ACL".

## Verification

All six verification gates for this phase (domain unit tests, web unit tests, typecheck, lint, build, and the scoped `ai-business-agent` Playwright e2e spec) were run in the foreground; full output is in `.superpowers/sdd/task-5-report.md`. The full Playwright suite was **not** run — the `local-supabase-*` specs require Supabase mode and the `app-shell` specs are already known-stale versus the current UI (see repo memory), so this phase's e2e run is intentionally scoped to `ai-business-agent` only.
