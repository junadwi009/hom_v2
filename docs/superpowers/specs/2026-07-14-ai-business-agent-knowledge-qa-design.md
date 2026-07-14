# AI Business Agent — Internal Knowledge Q&A (Sub-project 2a) — Design Spec

- **Date:** 2026-07-14
- **Status:** Implemented
- **Author:** Claude (with owner)
- **Builds on:** Sub-project 1 (RAG Knowledge Ingestion) — `docs/PHASE_RAG_1_KNOWLEDGE_INGESTION_LOG.md`, `docs/superpowers/specs/2026-07-13-rag-knowledge-ingestion-design.md`
- **Design source of truth:** `docs/06_AI_KNOWLEDGE_STUDIO.md` (§7 RAG retrieval rules, §8 AI safety), `AGENTS.md`

---

## 1. Goal (plain language)

Replace the "Segera hadir" placeholder AI Business Agent (`/settings/ai-management/business-agent`) with a real **internal assistant**: owner/staff type a question and get an answer grounded **only in the published knowledge base**, with cited sources, safety guardrails, and access limited to what the asker is allowed to see. It is a read-only helper — it never sends anything to customers, never mutates data.

This is the first slice of "wire retrieval into the AI Business Agent / Live Chat" (SP2). It reuses SP1's retrieval end-to-end.

## 2. Scope

### In scope
1. Replace the placeholder page with a chat-style internal assistant surface.
2. Answer questions grounded only in **published** knowledge chunks (reuse SP1 `match_knowledge_chunks`), filtered to the **scopes the asker may see**.
3. RBAC gate: **`can_use_ai_business_agent`**.
4. **Permission→scope** access mapping (see §5).
5. Always run the existing **policy guard** (safe fallback when no sources; withhold policy-violating answers).
6. **Audit** every answered query via a `SECURITY DEFINER` RPC.
7. Mock/OpenAI gateway parity (works with no API key in mock mode; never fakes success).

### Out of scope (later sub-projects)
- Multi-turn memory / follow-up query rewriting; server-persisted conversations (this MVP: chat transcript is **client-side only**, each turn is an independent retrieval).
- Grounding on operational data (appointments/clients/finance/clinical) — each such source needs its own permission gate + masking.
- **Live Chat customer draft-replies** and WhatsApp (SP2-b, separate spec — customer-facing, approval-gated).
- Full AI observability table / cost dashboards (`docs/06` §12) — this MVP logs to `audit_logs`.

## 3. Constraints (AGENTS.md)

- No direct LLM/DB calls from UI components; all LLM via the AI Gateway; business logic in `packages/domain` / server-only orchestrators.
- Validate server input with Zod.
- AI must NOT read finance data without permission, nor clinical notes unless allowed — enforced by §5.
- AI Business Agent access is a **sensitive domain**: permission check + audit required.
- Every screen has loading/empty/error/permission-denied/success states; never fake zero on failure.
- Secrets server-only; no prompt/PII logging beyond redacted audit metadata.

## 4. Architecture

Thin orchestrator reusing SP1 building blocks; new UI; one small migration.

```
Owner/staff asks (chat UI, "use client")
  → queryBusinessAgentAction (use server)
  → submit-business-agent-query.ts (server-only orchestrator):
      mode gate → auth → RBAC(can_use_ai_business_agent) → Zod validate
      → allowedScopes = allowedKnowledgeScopes(user.permissions)   [domain, pure]
      → embedText(question)              [gateway; mock w/o key]
      → rpcMatch(embedding, allowedScopes, k)   [SP1 match_knowledge_chunks; already takes scopes[]]
      → answerFromContext(question, contexts)   [gateway]
      → evaluateKnowledgeAnswer(answer, hasSources)   [SP1 policy guard]
      → record_ai_interaction RPC (audit)
      → return { answer, sources, policyFlags, mode }
```

**Reused unchanged from SP1:** `embedText`, `rpcMatch` (its `scopes text[]` param already supports multi-scope), `answerFromContext`, `evaluateKnowledgeAnswer`, gateway mock fallback, `getCurrentUser`, app-mode gating.

## 5. Permission → knowledge-scope access rule (the safety core)

`allowedKnowledgeScopes(permissions: PermissionKey[]): KnowledgeScope[]` — pure domain function:

| Scope | Included when the user has… |
|---|---|
| `public_chatbot` | (always, for any agent user) |
| `internal_admin` | (always) |
| `marketing` | (always) |
| `finance` | `can_view_financials` |
| `clinical_safety` | `can_view_clinical_cases` |
| `owner_only` | is owner role — approximated by `can_manage_users` OR `can_publish_knowledge` (owner-level perms held by `super_admin`/`studio_director`); confirmed against the role→permission matrix in planning |

The orchestrator passes exactly this set to `rpcMatch`, so retrieval can never surface finance/clinical/owner knowledge to a user lacking those rights. If the resulting set is empty (shouldn't happen — three scopes are always included), the query returns the no-sources safe fallback. **(superseded — see §13/§14: as originally implemented, this app-layer computation was the *only* enforcement of this rule; it is now also enforced DB-side inside `match_knowledge_chunks` itself, since the RPC is directly callable via PostgREST by any `authenticated` principal holding `can_use_ai_business_agent`.)**

> Note: the SP1 `match_knowledge_chunks` RPC gate (`can_manage_knowledge OR owner`) is stricter than `can_use_ai_business_agent`. To let agent users who are not knowledge-managers retrieve, the match RPC's permission gate must also accept `can_use_ai_business_agent`. This is a one-line change to the existing RPC (add the permission to its OR-gate), made in this sub-project's migration. Table RLS is unchanged (still owner/manager read-only for the sources UI); retrieval goes through the SECURITY DEFINER RPC which does its own gating.

## 6. Data / DB (one migration `20260714000100_ai_business_agent.sql`)

- **`record_ai_interaction(p_action text, p_target_id uuid, p_metadata jsonb)`** — `SECURITY DEFINER`, gate `can_use_ai_business_agent` (or owner), inserts one `audit_logs` row (`action` like `ai.business_agent.answered`, `risk_level='low'`, metadata redacted of raw question text — store only source ids/scope set/latency/mode/source count, NOT the raw question or answer). Grants: revoke public/anon, grant execute to authenticated.
- **Amend `match_knowledge_chunks`**: add `can_use_ai_business_agent` to its permission OR-gate (so agent users can retrieve). No other change; `search_path`/filters unchanged.
- No new tables (transcript is client-side; logs go to `audit_logs`).

## 7. Domain (`packages/domain/src/knowledge` or a small `ai` module)

- `allowedKnowledgeScopes(permissions)` pure function + unit tests (each scope's gate; owner-only only for owner perms; three base scopes always present).
- A Zod `businessAgentQueryInputSchema` = `{ question: string(3..500) }` (no scope field — scopes are derived, not user-chosen).

## 8. App layer (`apps/web/src/lib/ai/business-agent/` + `apps/web/src/features/ai-business-agent/`)

- `server/submit-business-agent-query.ts` (`server-only`): the orchestrator above; state union `BusinessAgentQueryState` (`idle | configuration_error | auth_required | permission_denied | validation_error | error | success{answer, sources[], policyFlags[], mode}`).
- `server/record-ai-interaction.ts`: thin wrapper calling the `record_ai_interaction` RPC (best-effort; a logging failure must NOT fail the user's answer).
- `query-business-agent-action.ts` (`"use server"`).

## 9. UI (`apps/web/src/features/ai-business-agent/`)

- `ai-business-agent-page.tsx` — presentational; loading/empty/permission-denied/error/success states; shows a mock-mode badge when `getGatewayMode()==="mock"`.
- `ai-business-agent-chat.tsx` (`"use client"`) — a transcript (client-side message list) + input; each user turn appends the question, runs `queryBusinessAgentAction`, appends the answer with **sources**, **policy flags**, and mode note. Reuses the token-class conventions from `knowledge-test-lab.tsx`.
- Replace `apps/web/src/app/settings/ai-management/business-agent/page.tsx` (currently `ModuleMockPage`) with the real wired page: `export const dynamic="force-dynamic"`, resolve `getCurrentUser`, compute `canUse = permissions.includes("can_use_ai_business_agent")`, render.
- `*.stories.tsx` for the page states.

## 10. Testing

- **Domain unit:** `allowedKnowledgeScopes` (all gates; base scopes always present; owner-only gating).
- **Web unit:** orchestrator returns `configuration_error` in mock mode; the query input schema.
- **DB:** psql-verify the amended `match_knowledge_chunks` lets a `can_use_ai_business_agent`-only user retrieve; `record_ai_interaction` writes an audit row and rejects a non-permitted caller.
- **Storybook:** page states.
- **Playwright smoke:** the Business Agent page renders its heading + input (mock-safe), reusing the SP1 e2e harness (pre-started :3100 mock server, `reuseExistingServer`).
- **Manual (controller):** in Supabase mode, ask the agent a question and confirm it retrieves the published chunk + writes the audit row.

## 11. Implementation phases (ordered)
1. DB migration (record_ai_interaction RPC + match-gate amendment) + psql verify.
2. Domain: `allowedKnowledgeScopes` + input schema + tests.
3. App: record-ai-interaction wrapper + submit-business-agent-query orchestrator + action + tests.
4. UI: chat component + presentational page + stories.
5. Wire the real page (replace placeholder) + build.
6. E2E smoke + docs (phase log, spec status) + full verification.

## 12. Assumptions / open questions
- **A1:** owner-only scope is gated by an owner-level permission (confirm exact key against `rolePermissionMatrix` in planning — `can_manage_users`/`can_publish_knowledge` are owner-held).
- **A2:** `can_use_ai_business_agent` exists in the DB permissions constraint + seed and is granted to appropriate roles (verify in planning; SP1 found the knowledge perms already seeded).
- **A3:** single-turn per question (no server-side conversation memory) is acceptable for the MVP. *(confirmed)*
- **Q1:** should the agent also expose a small "sources this scope set covers" hint? Deferred — not needed for MVP.

## 13. Deviations (post-implementation)

- **`owner_only` scope gated concretely by `can_publish_knowledge`** (resolves A1): the implementation uses `can_publish_knowledge` alone, not an OR with `can_manage_users`. This is the same permission SP1 uses to gate *publishing* owner-only-scoped knowledge, so retrieval and publish share one gate — simpler than the two-permission approximation sketched in §5, and no role in the current matrix holds `can_manage_users` without also holding `can_publish_knowledge`.
- **Audit via the `record_ai_interaction` RPC**, exactly as designed in §6 — `SECURITY DEFINER`, gated to `can_use_ai_business_agent OR owner`, metadata excludes raw question/answer text.
- **Match-gate widened** to add `can_use_ai_business_agent` to `match_knowledge_chunks`'s permission OR-gate, exactly as designed in §6 — additive, backward-compatible with SP1's Test Lab.
- **Chat UI appends completed turns via React "adjust state during render,"** not a `useEffect` — `ai-business-agent-chat.tsx` compares the latest `useActionState` result to a tracked `processedState` and appends synchronously during render when it changes, avoiding an extra effect-triggered render pass.
- **`match_knowledge_chunks` scope filter moved from trusting `p_scopes` to a DB-computed intersection** (found in final security review, fixed post-implementation — see §14): the RPC no longer filters on the caller-supplied `p_scopes` directly. It recomputes the caller's allowed scopes itself and filters on the intersection with `p_scopes`, so §5's rule is enforced twice (app layer + DB), with the DB as the authority.

## 14. Security fix (post-review): DB-authoritative scope ACL

**Finding:** `match_knowledge_chunks` is `SECURITY DEFINER`, `grant execute to authenticated`, and directly callable via PostgREST — i.e. reachable without going through `submit-business-agent-query.ts`'s orchestration. Its permission gate (`can_manage_knowledge OR owner OR can_use_ai_business_agent`) only checks *whether* the caller may call the RPC at all; it does not restrict *which* `p_scopes` a `can_use_ai_business_agent`-only caller may request. A principal holding only that permission (e.g. the `ai_agent_service` role, intended for machine/service callers) could therefore call the RPC directly with `p_scopes=['finance','clinical_safety','owner_only']` and retrieve sensitive published chunks — bypassing §5's rule entirely, since `allowedKnowledgeScopes` only runs in the app-layer orchestrator, not in the RPC.

**Fix (`supabase/migrations/20260714000200_knowledge_scope_acl.sql`):** `match_knowledge_chunks` now computes its own `v_allowed` scope array inside the function body — mirroring `allowedKnowledgeScopes` exactly (base `public_chatbot`/`internal_admin`/`marketing` always; `finance` if `private.has_permission('can_view_financials')`; `clinical_safety` if `private.has_permission('can_view_clinical_cases')`; `owner_only` if `private.has_permission('can_publish_knowledge')`) — then filters chunks on `ks.scopes && (p_scopes ∩ v_allowed)` rather than `ks.scopes && p_scopes`. Signature, guards (`AUTH_REQUIRED`/`APP_USER_REQUIRED`/`PERMISSION_DENIED`), `status='published'` filter, ordering, and the match-count cap are all unchanged. Verified via psql impersonation (see `.superpowers/sdd/task-5-report.md`): `studio_director` (holds all sensitive permissions) still retrieves a `finance`-scoped chunk; a temporary `ai_agent_service`-only principal gets 0 rows when requesting `['finance','owner_only']` directly against the RPC.
