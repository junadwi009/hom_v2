# Phase AI-DEMO-3 Vercel AI Demo Enablement + Verification Log

## Scope

Verified the already-implemented AI Demo Summary card on the deployed presentation
environment (`https://hom-gamma.vercel.app`, Supabase `pgokujwfwrxopgwhpluj`, model
default `openai/gpt-4.1-mini`) after the owner added the OpenRouter / Supabase / mode
environment variables in Vercel.

A required prerequisite surfaced during this phase: the AI-DEMO-2 feature code was not
yet on `origin/main` (which Vercel builds from), so the card could not appear regardless
of env vars. With owner approval, the feature code plus the pending Phase 8 / AI-DEMO
docs were committed and pushed to `main`, which triggered the Vercel deploy that
includes the card. No database mutation, no AI write access, no product-feature change,
no `db reset`, no `seed.sql`, no production data insert; the OpenRouter key was never
exposed to the browser, printed, or committed.

## Repo State

- Branch: `main`.
- Before this phase: `HEAD = origin/main = 811c48d…` (feature code untracked/unpushed).
- Commit created and pushed this phase: `5a01d75b4a7b8afbabc8450b7054e794a200d4d8`
  (`feat(ai-demo): add server-only OpenRouter demo summary card` + Phase 8 / AI-DEMO
  docs). Push: `811c48d..5a01d75 main -> main` (fast-forward).
- Staged set contained only the AI feature code, the appointments page change,
  `.env.example` (placeholders only), and the Phase 8 / AI-DEMO-1/2 docs. No
  `supabase/.temp`, credential files, `.env`, or secrets were staged. A pre-commit
  scan confirmed no real key material (`sk-or-`/`sk-`/`ghp_`/`github_pat_`/PRIVATE KEY)
  in the new files and no `NEXT_PUBLIC_OPENROUTER…=` declaration anywhere.

## Local Checks

All passed on `main` (post-implementation, unchanged code):
- `typecheck` — pass.
- `lint` — pass (0 errors, 0 warnings).
- `test` — pass (domain 117, web 235).
- `build` — pass.
- `build-storybook` — pass.
- `test:e2e` — pass (30 mock specs; 5 guarded local-Supabase specs skipped).

## Vercel Env Verification

Direct Vercel dashboard values were not read from outside; instead each requirement was
confirmed by its observable effect on the live deployment:

- `OPENROUTER_API_KEY` exists and is server-only: the card generated a real summary,
  and clicking "Generate Demo Insight" produced exactly one browser request — a
  same-origin `POST https://hom-gamma.vercel.app/appointments` (the server action),
  status 200, with NO browser request to `openrouter.ai`. The key is used only
  server-side. Not `NEXT_PUBLIC`.
- `AI_DEMO_ENABLED` is effectively `true`: the card rendered the enabled
  "Generate Demo Insight" button (not the disabled message) and produced a summary.
- No `NEXT_PUBLIC_OPENROUTER_API_KEY`: the repo scan found no such declaration, and the
  browser made no OpenRouter call, so no public key is shipped.
- Supabase points to `pgokujwfwrxopgwhpluj`: `/api/me` returns the mapped super_admin,
  and the pages render the `pgokujwfwrxopgwhpluj` DEMO dataset (source `supabase`).
- `HOM_AUTH_MODE=supabase`: `/api/me` returns `meta.authMode: "supabase"`.
- `HOM_DATA_MODE=supabase`: the read-only pages show `source: supabase` with the live
  DEMO data.
- `OPENROUTER_MODEL` absent → default applied: the rendered card shows
  `MODEL: OPENAI/GPT-4.1-MINI`.

## Redeploy Status

The GitHub push (`811c48d..5a01d75`) triggered the Vercel build for the connected
`junadwi009/hom_v2` `main` branch (root `apps/web`). The deploy completed and is live:
the `/appointments` page now renders the AI Demo Summary card, confirming the new build
is serving.

## Authenticated App Verification

Signed in as the staging/temporary-production super_admin (`junadwi009@gmail.com`,
`authMode: supabase`):
- `/appointments` loads.
- The "AI Demo Summary" card is visible and enabled (not disabled).
- Clicking "Generate Demo Insight" rendered a successful summary.
- Output is in Indonesian and presentation-friendly.
- Output includes appointment, package/session, and payment summaries.
- Output includes recommended follow-ups and risk notes.
- Output shows the model's demo disclaimer plus the fixed UI disclaimer
  ("Demo operational AI summary — not official financial, legal, or medical advice").
- The model name (`openai/gpt-4.1-mini`) is shown.

## AI Output Verification

The figures matched the live DEMO aggregates exactly:
- Appointments: 2 scheduled, 1 completed, 1 cancelled, 1 no-show, 2 upcoming.
- Packages/sessions: 2 active packages, 14 sessions remaining, no low-session packages.
- Payments: paid IDR 1.250.000, pending IDR 150.000, cancelled IDR 150.000 (aggregate
  totals by status).
- Three recommended follow-ups and three risk notes, all derived from the aggregates.

## Safety Verification

The rendered output contained only aggregate counts and IDR totals by status. None of
the following appeared:
- contact data (no phone/email),
- clinical data,
- WhatsApp content,
- payment reference numbers,
- card/bank/gateway data,
- notes or cancellation/reschedule reason text,
- raw audit metadata,
- raw OpenRouter/provider error text.

The IDR figures shown are allowlisted aggregate payment totals by status
(`paymentTotalsByStatusIdr`), not references, card, or bank data. The browser never
contacted OpenRouter, so the API key was never exposed client-side.

## Database Mutation Verification

Row counts were captured immediately before and after generation (read-only via the
pooler). They are identical — the AI generation created/updated/deleted ZERO rows:

| Table | Before | After |
|---|---|---|
| appointments | 5 | 5 |
| appointment_status_history | 9 | 9 |
| client_packages | 2 | 2 |
| package_usage_history | 3 | 3 |
| payments | 4 | 4 |
| payment_status_history | 6 | 6 |
| audit_logs | 18 | 18 |
| clients | 5 | 5 |
| practitioners | 2 | 2 |
| services | 2 | 2 |
| packages | 2 | 2 |

`audit_logs` is unchanged (18 → 18), confirming the AI path writes nothing at all — it
is a read-only aggregate `select` plus a server-side model call. Generation was run
twice; the database was unchanged both times.

## Final Checks

- Card visible + enabled on the deployed app: yes.
- Successful Indonesian, presentation-friendly summary with the required sections: yes.
- Model default `openai/gpt-4.1-mini` in effect: yes.
- No browser → OpenRouter request; key server-only; no `NEXT_PUBLIC_OPENROUTER_API_KEY`:
  confirmed.
- Zero database mutations from generation: confirmed.
- No secrets printed or committed; credential file not committed; `.env.example` holds
  placeholders only.

## Stop Point

Phase AI-DEMO-3 stops after this log. The AI Demo Summary card is verified working on
the deployed presentation environment, read-only and safe. No further product changes,
no production data, and no destructive operations were performed.
