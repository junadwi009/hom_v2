# Phase AI-DEMO-1 OpenRouter AI Demo Summary Plan

Planning only. Nothing is implemented in this phase. It plans a safe, demo-only,
read-only AI "Business Summary" panel powered by OpenRouter, for presentation on the
temporary-production / soft-launch environment (Supabase project
`pgokujwfwrxopgwhpluj`, app `https://hom-gamma.vercel.app`).

Hard prohibitions (carried into implementation): do not expose the OpenRouter API key
to the browser; do not add `NEXT_PUBLIC_OPENROUTER_API_KEY`; the AI gets no write
access and cannot create/update/delete appointments, packages, or payments; do not
send clinical data, WhatsApp content, payment secrets, or production/real customer
data; do not modify the stable appointment/package/payment workflows.

## 1. Scope

- Demo-only AI summary panel.
- Read-only data (aggregates only).
- No write tools, no database mutation.
- No autonomous agent, no tool-use, no WhatsApp sending.
- Strictly additive: the existing modules (appointments, packages/client_packages,
  deduction, manual payments, audit/history) are untouched.

## 2. Use Case

The panel summarizes safe, aggregated demo operational data:
- appointment status summary (counts by status),
- package / session balance summary (active packages, remaining sessions),
- payment summary (pending / paid / cancelled counts and totals),
- a short recommended follow-up list (e.g. "N pending payments to follow up",
  "M appointments upcoming") derived only from aggregates,
- no customer outreach automation — it suggests, it never contacts anyone.

## 3. Data Minimization

The server sends only aggregated/safe values to the model:
- counts by appointment status,
- counts by payment status (and summed amounts in IDR),
- package remaining-session summary (e.g. total active packages, total remaining
  sessions),
- NO phone / email / contact,
- NO clinical data,
- NO raw notes / reasons / free-text,
- NO payment reference numbers,
- NO card / bank / gateway data,
- NO individual client names required (prefer fully aggregated figures; if any
  example is shown, use a non-identifying label, never real contact info).

A allowlist approach: the aggregation query selects only the specific numeric/status
columns above; nothing else can reach the prompt.

## 4. Architecture

- A server-only OpenRouter adapter (e.g. `src/lib/ai/openrouter-summary.ts`),
  never imported by client components.
- A server action or server route handler (e.g. `POST /api/ai/demo-summary`) that:
  1. checks `AI_DEMO_ENABLED` and the user's session/permission,
  2. fetches the safe aggregates from Supabase server-side (read-only, via the
     existing read repositories / a dedicated aggregate query),
  3. builds a minimized prompt (Section 3),
  4. calls OpenRouter with the server-only key,
  5. returns the text to the UI.
- The UI calls the internal server path only; the browser never talks to OpenRouter
  and never sees the key.
- Response rendered in a dashboard card (read-only display).

## 5. Environment Variables

- `OPENROUTER_API_KEY` — server-only (never `NEXT_PUBLIC_*`).
- `OPENROUTER_MODEL` — the model id (e.g. a small, cheap model).
- `AI_DEMO_ENABLED` — feature flag; default off; when false the feature is fully
  disabled.
- Explicitly NOT added: `NEXT_PUBLIC_OPENROUTER_API_KEY` (forbidden).
- `.env.example` gets placeholders only; real values live in the host secret manager.

## 6. Privacy / Provider Controls

- Prefer a Zero-Data-Retention provider/model where available (OpenRouter
  provider-routing preferences / ZDR-eligible models); document the choice.
- No prompt logging that includes data; if any logging, log only timing/status, never
  the prompt body.
- No sensitive data in the prompt (enforced by the Section 3 allowlist).
- Request timeout; safe fallback if the model fails or is slow.

## 7. Cost / Reliability Controls

- Short `max_tokens` on the response.
- Request timeout (e.g. ~10s) with abort.
- No streaming for the first slice (simple request/response) unless needed later.
- Simple retry policy or no retry (prefer no retry for a demo to bound cost).
- Disabled by default if `AI_DEMO_ENABLED` is unset/false or the key is missing.
- On any failure, show "AI demo unavailable" safely (no stack traces, no raw errors).

## 8. UI Proposal

- Add an "AI Demo Summary" card on the dashboard (or the `/appointments` page).
- A "Generate Demo Insight" button.
- Loading / success / error states.
- A clear label that this is a demo insight, not official financial or clinical
  advice.

## 9. Tests (to write when implemented)

- No API key in the client bundle (assert no `OPENROUTER_API_KEY` /
  `NEXT_PUBLIC_OPENROUTER` reference reaches client code).
- Feature disabled when `AI_DEMO_ENABLED=false` (route returns a safe disabled state).
- Prompt builder excludes contact / clinical / payment-secret / reference / notes
  fields (unit test on the aggregate-to-prompt mapping).
- OpenRouter errors / timeouts map to the safe UI error.
- Aggregation works on the demo data (counts by status, remaining sessions, payment
  totals).
- No write methods are called (the adapter and route expose no mutation path).

## 10. Non-Goals

- Production AI.
- WhatsApp chatbot.
- Knowledge upload.
- Autonomous agent / tool use.
- Write-back recommendations (the AI never mutates data).
- Clinical notes analysis.

## 11. Recommended Next Slice

- Phase AI-DEMO-2: implement the read-only OpenRouter demo summary — server-only
  adapter + safe aggregate query + internal server route + the dashboard card, behind
  `AI_DEMO_ENABLED`, with the Section 9 tests. Gated on owner approval and the
  OpenRouter key being provisioned as a server-only secret.

## 12. Resolved Model, Output, and Credential Status

### Model selection (locked, pending availability verification)
- Primary: `openai/gpt-4.1-mini`.
- Fallback order if the primary is unavailable on OpenRouter:
  1. `openai/gpt-4.1-mini`
  2. `google/gemini-2.5-flash`
  3. `anthropic/claude-3.5-haiku`
- Rationale: read-only summary, not a heavy agent — prioritize low latency, low cost,
  stable summaries, and good Indonesian/English output. Do not use an expensive
  reasoning model unless the owner approves; do not use a free/random router for the
  presentation (output consistency matters).
- Availability verification (OpenRouter `/api/v1/models`): all three candidates are
  AVAILABLE — `openai/gpt-4.1-mini` (primary, selected), `google/gemini-2.5-flash`,
  `anthropic/claude-3.5-haiku`. No fallback needed; primary stands.

### Credential source and parsing
- Read from the local file `Credential List HOM.txt` (never committed, never copied
  into any doc/.env). Parse `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` if present.
- If `OPENROUTER_API_KEY` is missing → stop and report (done this turn; see Credential
  Status).
- If `OPENROUTER_MODEL` is missing → default to `openai/gpt-4.1-mini`.

### Environment contract (server-only)
- `OPENROUTER_API_KEY` — server-only secret; NEVER `NEXT_PUBLIC_*`.
- `OPENROUTER_MODEL` — default `openai/gpt-4.1-mini`.
- `AI_DEMO_ENABLED` — `true` only for the presentation environment AND only when the
  key is present. The key is now present and valid, so the demo may be enabled
  (`AI_DEMO_ENABLED=true`) for the presentation environment; set `false` otherwise.
- Vercel: add `OPENROUTER_API_KEY` as a server-side env var only (not exposed to the
  browser).

### Structured JSON output (requested from the model)
The request asks for JSON with exactly these fields:
- `summaryTitle`
- `appointmentSummary`
- `packageSummary`
- `paymentSummary`
- `recommendedFollowUps`
- `riskNotes`
- `demoDisclaimer`

The UI renders this as a demo insight card that states it is a demo operational
summary, not official financial / legal / medical advice.

### Failure behavior
If OpenRouter fails, times out, or env is missing: show "AI demo unavailable"; do not
crash the page; do not retry aggressively; do not expose raw provider errors.

### Credential Status (resolved)
`OPENROUTER_API_KEY` IS now present in the local credential file (label `openrouter`),
parsed as a single `sk-or-…` token and validated against OpenRouter
(`GET /api/v1/key` → HTTP 200 = valid/authenticated). `OPENROUTER_MODEL` is not in the
file → default `openai/gpt-4.1-mini` (verified available). The key value was never
printed, copied into this doc, or committed; it remains only in the untracked local
credential file and must be set as a Vercel server-only env var for runtime.
Credential-dependent work is UNBLOCKED; AI-DEMO-2 implementation still requires
separate owner approval.

## Stop Point

Phase AI-DEMO-1 stops after this plan update. No AI code, env var, key, or UI was
added; no credential value was printed, copied into this doc, or committed.
Implementation (AI-DEMO-2) and model availability verification require the
server-only `OPENROUTER_API_KEY` and separate owner approval.
