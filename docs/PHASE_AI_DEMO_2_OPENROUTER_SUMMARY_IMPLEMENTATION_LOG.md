# Phase AI-DEMO-2 OpenRouter Demo Summary Implementation Log

## Scope

Implemented a safe, demo-only, read-only "AI Demo Summary" card powered by OpenRouter,
for presentation on the temporary-production / soft-launch environment (Supabase
`pgokujwfwrxopgwhpluj`, app `https://hom-gamma.vercel.app`). The feature summarizes
aggregate operational counts only; it has no write access and does not touch the stable
appointment/package/payment workflows.

Honored prohibitions: the OpenRouter API key is server-only and never exposed to the
browser; no `NEXT_PUBLIC_OPENROUTER_API_KEY`; the key was never printed or committed; no
credential file committed; no database mutation; AI cannot create/update/delete any
record; no contact/clinical/WhatsApp/notes/reasons/reference/card/bank/gateway data or
raw audit metadata is ever sent; stable workflows unchanged.

## Files Changed

New server-only library (`apps/web/src/lib/ai/`):
- `ai-demo-config.ts` — reads `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (default
  `openai/gpt-4.1-mini`), `AI_DEMO_ENABLED`; returns a disabled state when the flag is
  not `true` or the key is missing. The key is read here and consumed only server-side.
- `ai-demo-types.ts` — Zod schemas/types for the safe aggregate, the summary JSON, the
  action state, and shared constants (disclaimer, unavailable message). No server-only
  import, so the client may import the types/constants without pulling server code.
- `ai-demo-aggregate-loader.ts` — server-side aggregate query (allowlisted columns
  only).
- `ai-demo-prompt.ts` — prompt builder that re-projects the aggregate through an
  explicit allowlist.
- `openrouter-client.ts` — server-only OpenRouter adapter (timeout, no retry, no prompt
  logging, safe errors).
- `generate-ai-demo-summary.ts` — orchestration: config → aggregate → prompt →
  OpenRouter → safe JSON parse/validate.
- `submit-ai-demo-summary.ts` — auth + permission gate before generation; no writes.

New feature (`apps/web/src/features/ai-demo/`):
- `ai-demo-summary-action.ts` — `"use server"` action wrapper.
- `ai-demo-summary-card.tsx` — `"use client"` card (button + states + disclaimer).
- `ai-demo-summary-card.stories.tsx` — Storybook states (Idle, Loading, Success,
  Unavailable, Disabled, NoPermission).

New tests (`apps/web/tests/unit/ai-demo/`): `ai-demo-config.test.ts`,
`ai-demo-aggregate-loader.test.ts`, `ai-demo-prompt.test.ts`,
`generate-ai-demo-summary.test.ts`, `submit-ai-demo-summary.test.ts`,
`ai-demo-client-safety.test.ts`.

Modified:
- `apps/web/src/app/appointments/page.tsx` — renders the card below the schedule,
  passing `enabled={isAiDemoEnabled()}`, `canView={…}`, and the server action. The
  stable appointments component, its actions, and its tests/stories are untouched.
- `.env.example` — added server-only placeholders `OPENROUTER_API_KEY=""`,
  `OPENROUTER_MODEL="openai/gpt-4.1-mini"`, `AI_DEMO_ENABLED="false"` with an explicit
  "never add NEXT_PUBLIC_OPENROUTER_API_KEY" note. Placeholders only, no values.

## Env Handling

- Server-only config reader (`ai-demo-config.ts`, marked `import "server-only"`) reads
  the three vars. `getAiDemoConfig()` returns `{enabled:false, reason:"disabled"}` when
  `AI_DEMO_ENABLED !== "true"`, `{enabled:false, reason:"missing_key"}` when the key is
  absent, else `{enabled:true, model}`. Model defaults to `openai/gpt-4.1-mini`.
- `getOpenRouterApiKey()` is server-only and consumed only inside the adapter/
  orchestration; it is never returned to a client component. The card receives only a
  boolean `enabled` flag and the server action reference.
- Vercel: set `OPENROUTER_API_KEY` as a server-side env var only, `OPENROUTER_MODEL=
  openai/gpt-4.1-mini`, and `AI_DEMO_ENABLED=true` for the presentation environment
  (leave `false`/unset otherwise). This was NOT applied to Vercel in this phase (env
  changes are owner-controlled and the key must not be exposed); until set, the card
  renders the disabled state on the deployed app.

## Aggregate Data Allowlist

The loader selects ONLY non-sensitive columns:
- `appointments`: `status, starts_at`
- `payments`: `status, amount_idr`
- `client_packages`: `status, remaining_sessions`

It never selects `client_id`, names, email, phone, notes, reasons, references, or
card/bank/gateway fields. From these it computes: appointment counts by status,
upcoming appointment count (scheduled/confirmed with a future start), payment counts by
status, payment IDR totals by status, active package count, total remaining sessions,
and a low-session package count. The loader performs only `select` — no insert/update/
delete/upsert. A test asserts the selected columns exclude sensitive fields and that no
write method is ever called.

## Prompt Safety

`buildAiDemoMessages` re-projects the aggregate through an explicit allowlist of the
seven safe fields before serializing, so even if extra keys were attached to the object
they cannot reach the model. The system prompt states the data is demo operational
data, forbids inventing client identities, forbids financial/legal/medical advice,
requests concise presentation-friendly output, prefers Indonesian, and requires strict
JSON with exactly the seven keys. A test pollutes the aggregate with fake email/phone/
notes/reason/reference/card values and asserts none appear in the serialized messages,
while the safe aggregate keys do.

## OpenRouter Adapter Behavior

Server-only. POSTs to `https://openrouter.ai/api/v1/chat/completions` with the model
from `OPENROUTER_MODEL`, `max_tokens: 700`, `temperature: 0.3`,
`response_format: { type: "json_object" }`, and the two messages. ~10s `AbortController`
timeout, no retry, no prompt logging. On network failure/timeout, non-2xx status, or an
empty completion it throws an `OpenRouterError` whose message never includes the
provider response body. The orchestration extracts the JSON object, validates it with
the summary schema, and maps any failure (provider error, invalid JSON, schema
mismatch) to the safe `{status:"unavailable", message:"AI demo unavailable"}` state.

## UI Behavior

The "AI Demo Summary" card on `/appointments`:
- Disabled state when `enabled` is false (env off / key missing) or the user lacks an
  operational view permission — shows a safe explanatory message, no request is made.
- Button "Generate Demo Insight"; "Generating…" while pending.
- Success renders `summaryTitle`, the three summaries, the recommended-follow-ups and
  risk-notes lists, the model's `demoDisclaimer`, and the model name.
- Error state shows "AI demo unavailable" (no raw errors).
- A fixed disclaimer is always shown: "Demo operational AI summary — not official
  financial, legal, or medical advice."

The card is a client component that imports only types/constants (no server modules,
no `process.env`, no key). Access is gated server-side in the action by requiring an
authenticated user with `can_view_appointments` or `can_view_payments` (super_admin
qualifies). The action performs no database writes.

## Tests

- config: disabled when `AI_DEMO_ENABLED!="true"`; disabled (missing_key) when key
  absent; enabled when both present; model default `openai/gpt-4.1-mini`.
- aggregate loader: selects allowlisted columns only (no sensitive fields), never calls
  a write method, and computes the expected counts/totals.
- prompt: builds system+user messages with JSON/Indonesian/no-advice instructions and
  excludes injected sensitive fields while keeping the safe aggregate keys.
- generate: returns disabled when config disabled; success on valid JSON; maps provider
  error and invalid JSON to the safe unavailable state (no leaked error text).
- submit: unavailable when unauthenticated, when lacking view permission, and when the
  boundary throws; delegates to generate only for a permitted user.
- client safety: no `NEXT_PUBLIC_OPENROUTER` reference in code; no
  `NEXT_PUBLIC_OPENROUTER…=` declaration in `.env.example`; the client card has no
  `OPENROUTER_API_KEY`/`process.env`/server-module imports; every server module is
  marked `import "server-only"`; the card renders the disabled/loading/success/error
  states and the disclaimer.
- UI states are also covered by the Storybook stories (built in `build-storybook`).

## Verification

Local gates (all pass):
- `typecheck` — pass.
- `lint` — pass (0 errors, 0 warnings).
- `test` — pass (235 web tests, incl. 23 new AI-demo assertions across 6 files).
- `build` — pass.
- `build-storybook` — pass.
- `test:e2e` — pass (30 mock specs; 5 guarded local-Supabase specs skipped).

Live model check (manual, guarded): a standalone call to OpenRouter using the chosen
model (`openai/gpt-4.1-mini`) with the exact system/user prompt over a representative
demo aggregate returned HTTP 200 and valid JSON containing all seven required keys
(`recommendedFollowUps`/`riskNotes` as arrays), in Indonesian, correctly reflecting the
counts. The prompt contained only aggregate counts (no PII); the key was supplied via a
transient env var and never printed. No database rows were created/updated/deleted (the
feature path is read-only `select` plus a model call).

Note: the deployed app at `hom-gamma.vercel.app` will show the card's disabled state
until the owner sets `OPENROUTER_API_KEY` (server-only), `OPENROUTER_MODEL`, and
`AI_DEMO_ENABLED=true` in Vercel. An in-app authenticated "Generate Demo Insight" run is
the remaining owner-side check once those env vars are set.

## Safety Confirmation

- OpenRouter API key is server-only; no `NEXT_PUBLIC_OPENROUTER_API_KEY`; the key was
  never printed or committed; no credential file committed.
- No database mutation; AI has no write tools and cannot create/update/delete
  appointments, packages, or payments.
- Only aggregate counts/IDR totals reach the model — no contact, clinical, WhatsApp,
  notes, reasons, payment references, card/bank/gateway data, or raw audit metadata.
- Stable appointment/package/payment workflows and their tests/stories are unchanged;
  the card is purely additive.
- `.env.example` holds placeholders only (no values).

## Stop Point

Phase AI-DEMO-2 stops after this log. The feature is implemented, tested, and verified
locally (with a guarded live model check). Enabling it on the deployed app requires the
owner to set the server-only env vars in Vercel; no production deployment or Vercel env
change was performed here.
