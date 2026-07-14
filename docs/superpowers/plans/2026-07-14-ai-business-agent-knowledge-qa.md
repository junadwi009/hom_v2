# AI Business Agent (SP2a) — Internal Knowledge Q&A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Segera hadir" AI Business Agent placeholder with a real internal assistant that answers questions grounded only in the published knowledge base, scope-limited to what the asker may see, with cited sources, policy-guard safety, and audit.

**Architecture:** A thin server-action orchestrator reuses SP1's retrieval building blocks (`embedText`, `match_knowledge_chunks` RPC, `answerFromContext`, `evaluateKnowledgeAnswer`, gateway mock fallback). One small migration adds an audit RPC and widens the match RPC's permission gate. A client-side chat transcript surfaces it. No new tables; single-turn per question.

**Tech Stack:** Next.js 16 server actions, TypeScript strict, Zod 4, Supabase (Postgres + pgvector), the SP1 AI Gateway (OpenAI + deterministic mock). Vitest, Playwright, Storybook.

**Spec:** `docs/superpowers/specs/2026-07-14-ai-business-agent-knowledge-qa-design.md`.

## Global Constraints

- **TS strict; Zod on all server input; no LLM/DB calls from UI components.** Business logic in `packages/domain` / server-only orchestrators; all LLM via the gateway.
- **RBAC gate:** `can_use_ai_business_agent`. It exists in the DB permissions constraint + seed (granted to `studio_director`, `ai_agent_service`).
- **Permission→scope mapping** (retrieval never surfaces disallowed knowledge): base `public_chatbot`+`internal_admin`+`marketing` always; `finance` iff `can_view_financials`; `clinical_safety` iff `can_view_clinical_cases`; `owner_only` iff `can_publish_knowledge` (owner-held by super_admin+studio_director).
- **Mode gating:** orchestrator returns `configuration_error` unless `getDataMode()==="supabase" && getAuthMode()==="supabase"`.
- **Gateway fallback:** absent `OPENAI_API_KEY` ⇒ mock mode; never fake success (show a mock badge).
- **Audit:** every answered query logs one `audit_logs` row via a `SECURITY DEFINER` RPC; metadata excludes the raw question/answer text (store only source ids, scope set, mode, source count, latency).
- **All writes/audit via SECURITY DEFINER RPC** (`errcode='P0001'`, UPPER_SNAKE messages; `revoke ... from public, anon; grant execute to authenticated`).
- **Tooling (pnpm NOT on PATH):** run pnpm via `npx --yes pnpm@11.3.0 --dir apps/web <script>`; domain tests via `npx --yes pnpm@11.3.0 --dir packages/domain test`; migrations via `./node_modules/.bin/supabase.CMD db reset` (Docker container `supabase_db_hom-studio-os-v2`). Any apps/web unit test importing a `server-only` module MUST start with `vi.mock("server-only", () => ({}));`. `createSupabaseServerClient()` is async — always `await`.

---

## Task 1: DB migration — audit RPC + widen match gate

**Files:**
- Create: `supabase/migrations/20260714000100_ai_business_agent.sql`

**Interfaces:**
- Produces: `public.record_ai_interaction(p_action text, p_target_id uuid, p_metadata jsonb) returns void`; an amended `public.match_knowledge_chunks(...)` whose permission gate also accepts `can_use_ai_business_agent`.

- [ ] **Step 1: Write the migration**

First READ the current `supabase/migrations/20260713000200_knowledge_rpcs.sql` and copy the **entire current** `match_knowledge_chunks` function body verbatim into this new migration as a `create or replace`, changing ONLY its permission gate line from:
```sql
  if not (private.has_permission('can_manage_knowledge') or private.has_owner_role()) then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;
```
to:
```sql
  if not (private.has_permission('can_manage_knowledge') or private.has_owner_role()
          or private.has_permission('can_use_ai_business_agent')) then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;
```
Keep everything else identical (the `APP_USER_REQUIRED` guard, `set search_path = public, extensions, private`, published+scope filters, ordering, cap).

Then add the audit RPC:
```sql
-- 20260714000100_ai_business_agent.sql
-- (1) create or replace public.match_knowledge_chunks(...) with the widened gate — full body copied
--     from 20260713000200_knowledge_rpcs.sql, only the permission gate changed as described above.

-- (2) audit RPC for read-only AI Business Agent interactions.
create or replace function public.record_ai_interaction(
  p_action text, p_target_id uuid, p_metadata jsonb
) returns void
language plpgsql security definer set search_path = public, private as $$
declare v_actor public.app_users;
begin
  if auth.uid() is null then raise exception using errcode='P0001', message='AUTH_REQUIRED'; end if;
  select * into v_actor from public.app_users where auth_user_id = auth.uid() and status='active' limit 1;
  if v_actor.id is null then raise exception using errcode='P0001', message='APP_USER_REQUIRED'; end if;
  if not (private.has_permission('can_use_ai_business_agent') or private.has_owner_role()) then
    raise exception using errcode='P0001', message='PERMISSION_DENIED'; end if;
  if p_action !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception using errcode='P0001', message='ACTION_INVALID'; end if;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), p_action, 'ai_interaction', p_target_id, 'low', coalesce(p_metadata, '{}'::jsonb));
end $$;

revoke all on function public.record_ai_interaction(text, uuid, jsonb) from public, anon;
grant execute on function public.record_ai_interaction(text, uuid, jsonb) to authenticated;
```

- [ ] **Step 2: Apply + verify**

Run:
```bash
./node_modules/.bin/supabase.CMD db reset
```
Then verify as the seeded studio_director (has can_use_ai_business_agent AND can_manage_knowledge) that both RPCs work, and a non-owner sub is rejected:
```bash
printf '%s\n' "
begin;
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';
select public.record_ai_interaction('ai.business_agent.answered', null, '{\"sourceCount\":0}'::jsonb);
select count(*) from public.audit_logs where action='ai.business_agent.answered';
rollback;
" | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At
```
Expected: the `count` is `1` (row inserted). Then confirm rejection:
```bash
printf '%s\n' "
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000ff';
select public.record_ai_interaction('ai.business_agent.answered', null, '{}'::jsonb);
rollback;
" | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At 2>&1 | head -1
```
Expected: an error line containing `APP_USER_REQUIRED`.

- [ ] **Step 3: Verify the widened match gate still compiles/works**

Run (studio_director can still match — regression):
```bash
printf '%s\n' "
begin;
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';
select count(*) from public.match_knowledge_chunks(('[' || array_to_string(array(select 0 from generate_series(1,1535)),',') || ',1]')::extensions.vector, array['public_chatbot'], 5);
rollback;
" | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At 2>&1 | head -1
```
Expected: a number (0 or more), no `operator does not exist` / `PERMISSION_DENIED` error.

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/20260714000100_ai_business_agent.sql
git commit -m "feat(db): AI business agent audit RPC + widen match gate for can_use_ai_business_agent"
```

---

## Task 2: Domain — allowedKnowledgeScopes + query schema

**Files:**
- Create: `packages/domain/src/knowledge/access.ts`
- Modify: `packages/domain/src/knowledge/schemas.ts` (add `businessAgentQueryInputSchema`), `types.ts` (add `BusinessAgentQueryInput`), `index.ts` (export both + `allowedKnowledgeScopes`)
- Modify: `packages/domain/tests/knowledge.test.ts` (append tests)

**Interfaces:**
- Consumes: `KnowledgeScope` (types), `PermissionKey` (from `../rbac`).
- Produces: `allowedKnowledgeScopes(permissions: readonly PermissionKey[]): KnowledgeScope[]`; `businessAgentQueryInputSchema` (`{ question: string 3..500 }`); `BusinessAgentQueryInput`.

- [ ] **Step 1: Write the failing tests**

```ts
// append to packages/domain/tests/knowledge.test.ts
import { allowedKnowledgeScopes, businessAgentQueryInputSchema } from "../src/knowledge";

describe("allowedKnowledgeScopes", () => {
  it("always includes the 3 base scopes", () => {
    const s = allowedKnowledgeScopes([]);
    expect(s).toEqual(expect.arrayContaining(["public_chatbot", "internal_admin", "marketing"]));
    expect(s).not.toContain("finance");
    expect(s).not.toContain("clinical_safety");
    expect(s).not.toContain("owner_only");
  });
  it("adds finance only with can_view_financials", () => {
    expect(allowedKnowledgeScopes(["can_view_financials"])).toContain("finance");
  });
  it("adds clinical_safety only with can_view_clinical_cases", () => {
    expect(allowedKnowledgeScopes(["can_view_clinical_cases"])).toContain("clinical_safety");
  });
  it("adds owner_only only with can_publish_knowledge", () => {
    expect(allowedKnowledgeScopes(["can_publish_knowledge"])).toContain("owner_only");
  });
});

describe("businessAgentQueryInputSchema", () => {
  it("accepts a valid question", () => {
    expect(() => businessAgentQueryInputSchema.parse({ question: "Berapa harga?" })).not.toThrow();
  });
  it("rejects a too-short question", () => {
    expect(() => businessAgentQueryInputSchema.parse({ question: "hi" })).toThrow();
  });
  it("rejects unknown keys", () => {
    expect(() => businessAgentQueryInputSchema.parse({ question: "valid question", extra: 1 })).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npx --yes pnpm@11.3.0 --dir packages/domain test -- knowledge` → FAIL.

- [ ] **Step 3: Implement access.ts + schema**

```ts
// packages/domain/src/knowledge/access.ts
import type { PermissionKey } from "../rbac";
import type { KnowledgeScope } from "./types";

// Maps a user's permissions to the knowledge scopes they may retrieve from.
// Base scopes are always allowed for an agent user; sensitive scopes are gated.
export function allowedKnowledgeScopes(permissions: readonly PermissionKey[]): KnowledgeScope[] {
  const scopes: KnowledgeScope[] = ["public_chatbot", "internal_admin", "marketing"];
  if (permissions.includes("can_view_financials")) scopes.push("finance");
  if (permissions.includes("can_view_clinical_cases")) scopes.push("clinical_safety");
  if (permissions.includes("can_publish_knowledge")) scopes.push("owner_only");
  return scopes;
}
```

```ts
// add to packages/domain/src/knowledge/schemas.ts
export const businessAgentQueryInputSchema = z
  .object({ question: z.string().trim().min(3).max(500) })
  .strict();
```

```ts
// add to packages/domain/src/knowledge/types.ts
export type BusinessAgentQueryInput = z.infer<typeof businessAgentQueryInputSchema>;
```
(import `businessAgentQueryInputSchema` into types.ts's `import type` block.)

In `packages/domain/src/knowledge/index.ts` add: `export { allowedKnowledgeScopes } from "./access";`, `businessAgentQueryInputSchema` to the schemas export block, and `BusinessAgentQueryInput` to the types export block (keep alphabetical grouping).

- [ ] **Step 4: Run to verify pass** — `npx --yes pnpm@11.3.0 --dir packages/domain test` → PASS (all domain tests).

- [ ] **Step 5: Commit**
```bash
git add packages/domain/src/knowledge packages/domain/tests/knowledge.test.ts
git commit -m "feat(domain): allowedKnowledgeScopes + business agent query schema"
```

---

## Task 3: App — orchestrator + audit wrapper + action

**Files:**
- Create: `apps/web/src/lib/ai/business-agent/server/record-ai-interaction.ts`, `apps/web/src/lib/ai/business-agent/server/submit-business-agent-query.ts`
- Create: `apps/web/src/features/ai-business-agent/business-agent-action-types.ts`, `apps/web/src/features/ai-business-agent/query-business-agent-action.ts`
- Create: `apps/web/tests/unit/submit-business-agent-query.test.ts`

**Interfaces:**
- Consumes: `businessAgentQueryInputSchema`, `allowedKnowledgeScopes`, `evaluateKnowledgeAnswer` (`@hom/domain/knowledge`); `embedText`, `answerFromContext`, `getGatewayMode` (`@/lib/ai/gateway`); `rpcMatch` (`@/lib/knowledge/server/knowledge-rpcs`); `getCurrentUser`; `getDataMode`/`getAuthMode`; `createSupabaseServerClient`.
- Produces: `submitBusinessAgentQuery(formData: FormData): Promise<BusinessAgentQueryState>`; `queryBusinessAgentAction(prev, formData)`; the `BusinessAgentQueryState` union + `initialBusinessAgentQueryState`.

- [ ] **Step 1: Failing test (mock mode → configuration_error)**

```ts
// apps/web/tests/unit/submit-business-agent-query.test.ts
import { describe, expect, it, beforeEach, vi } from "vitest";
vi.mock("server-only", () => ({}));

describe("submitBusinessAgentQuery", () => {
  beforeEach(() => { process.env.HOM_DATA_MODE = "mock"; process.env.HOM_AUTH_MODE = "mock"; });
  it("refuses in mock mode", async () => {
    const { submitBusinessAgentQuery } = await import("@/lib/ai/business-agent/server/submit-business-agent-query");
    const fd = new FormData();
    fd.set("question", "Berapa harga private session?");
    const state = await submitBusinessAgentQuery(fd);
    expect(state.status).toBe("configuration_error");
  }, 20000);
});
```

- [ ] **Step 2: Run to verify fail** — `npx --yes pnpm@11.3.0 --dir apps/web test -- submit-business-agent-query` → FAIL.

- [ ] **Step 3: Implement types, record wrapper, orchestrator, action**

```ts
// apps/web/src/features/ai-business-agent/business-agent-action-types.ts
export type BusinessAgentQueryState =
  | { status: "idle" }
  | { status: "configuration_error" | "auth_required" | "permission_denied" | "validation_error" | "error"; message: string }
  | { status: "success"; answer: string; sources: { title: string; snippet: string }[]; policyFlags: string[]; mode: "openai" | "mock" };
export const initialBusinessAgentQueryState: BusinessAgentQueryState = { status: "idle" };
```

```ts
// apps/web/src/lib/ai/business-agent/server/record-ai-interaction.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Best-effort audit; a logging failure must never fail the user's answer.
export async function recordAiInteraction(input: {
  action: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("record_ai_interaction", {
      p_action: input.action,
      p_target_id: input.targetId,
      p_metadata: input.metadata,
    });
  } catch {
    // swallow — never surface audit failures to the caller
  }
}
```

```ts
// apps/web/src/lib/ai/business-agent/server/submit-business-agent-query.ts
import "server-only";
import { z } from "zod";
import {
  allowedKnowledgeScopes,
  businessAgentQueryInputSchema,
  evaluateKnowledgeAnswer,
} from "@hom/domain/knowledge";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerFromContext, embedText, getGatewayMode } from "@/lib/ai/gateway";
import { rpcMatch } from "@/lib/knowledge/server/knowledge-rpcs";
import { recordAiInteraction } from "./record-ai-interaction";
import type { BusinessAgentQueryState } from "@/features/ai-business-agent/business-agent-action-types";

export async function submitBusinessAgentQuery(formData: FormData): Promise<BusinessAgentQueryState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return { status: "configuration_error", message: "AI Business Agent tidak tersedia di mode mock/preview." };
  }
  let user = null;
  try { user = await getCurrentUser(); } catch { return { status: "auth_required", message: "Silakan login ulang." }; }
  if (!user) return { status: "auth_required", message: "Silakan login ulang." };
  if (!user.permissions.includes("can_use_ai_business_agent")) {
    return { status: "permission_denied", message: "Anda tidak punya akses AI Business Agent." };
  }
  let input: z.infer<typeof businessAgentQueryInputSchema>;
  try {
    input = businessAgentQueryInputSchema.parse({ question: String(formData.get("question") ?? "") });
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "validation_error", message: "Pertanyaan minimal 3 karakter." };
    throw e;
  }
  try {
    const scopes = allowedKnowledgeScopes(user.permissions);
    const queryEmbedding = await embedText(input.question);
    const matches = await rpcMatch({ embedding: queryEmbedding, scopes, matchCount: 5 });
    const hasSources = matches.length > 0;
    const rawAnswer = hasSources
      ? await answerFromContext({ question: input.question, contexts: matches.map((m) => m.content) })
      : "";
    const guarded = evaluateKnowledgeAnswer({ answer: rawAnswer, hasSources });
    await recordAiInteraction({
      action: "ai.business_agent.answered",
      targetId: null,
      metadata: {
        sourceCount: matches.length,
        sourceIds: matches.map((m) => m.sourceId),
        scopes,
        policyFlags: guarded.policyFlags,
        mode: getGatewayMode(),
      },
    });
    return {
      status: "success",
      answer: guarded.answer,
      policyFlags: guarded.policyFlags,
      sources: matches.map((m) => ({ title: m.sourceTitle, snippet: m.content.slice(0, 200) })),
      mode: getGatewayMode(),
    };
  } catch {
    return { status: "error", message: "Gagal menjalankan AI Business Agent." };
  }
}
```

```ts
// apps/web/src/features/ai-business-agent/query-business-agent-action.ts
"use server";
import { submitBusinessAgentQuery } from "@/lib/ai/business-agent/server/submit-business-agent-query";
import type { BusinessAgentQueryState } from "./business-agent-action-types";

export async function queryBusinessAgentAction(
  _prev: BusinessAgentQueryState,
  formData: FormData,
): Promise<BusinessAgentQueryState> {
  return submitBusinessAgentQuery(formData);
}
```

- [ ] **Step 4: Run to verify pass** — `npx --yes pnpm@11.3.0 --dir apps/web test -- submit-business-agent-query` → PASS; then `npx --yes pnpm@11.3.0 --dir apps/web typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/lib/ai/business-agent apps/web/src/features/ai-business-agent apps/web/tests/unit/submit-business-agent-query.test.ts
git commit -m "feat(web): AI business agent query orchestrator + audit + action"
```

---

## Task 4: UI — chat component, presentational page, stories, wire real page

**Files:**
- Create: `apps/web/src/features/ai-business-agent/ai-business-agent-chat.tsx`, `ai-business-agent-page.tsx`, `ai-business-agent-page.stories.tsx`
- Modify: `apps/web/src/app/settings/ai-management/business-agent/page.tsx` (replace `ModuleMockPage`)

**Interfaces:**
- Consumes: `queryBusinessAgentAction`, `initialBusinessAgentQueryState`, `getCurrentUser`, `getGatewayMode`, shared components (`PageHeader`, `DashboardCard`, `PermissionDeniedState`, `ErrorState`, `Button`).
- Produces: `AiBusinessAgentPage({ canUse, source })` presentational; `AiBusinessAgentChat()` client transcript.

- [ ] **Step 1: Implement the client chat component**

```tsx
// apps/web/src/features/ai-business-agent/ai-business-agent-chat.tsx
"use client";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { queryBusinessAgentAction } from "./query-business-agent-action";
import { initialBusinessAgentQueryState } from "./business-agent-action-types";

const inputClassName =
  "w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-foreground";

type Turn = { question: string; answer: string; sources: { title: string; snippet: string }[]; policyFlags: string[]; mode: string };

export function AiBusinessAgentChat() {
  const [state, formAction, pending] = useActionState(queryBusinessAgentAction, initialBusinessAgentQueryState);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [lastQuestion, setLastQuestion] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      setTurns((t) => [...t, { question: lastQuestion, answer: state.answer, sources: state.sources, policyFlags: state.policyFlags, mode: state.mode }]);
    }
  }, [state, lastQuestion]);

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {turns.map((t, i) => (
          <li key={i} className="space-y-1">
            <p className="text-sm font-medium text-foreground">Anda: {t.question}</p>
            <p className="rounded-md bg-stone-50 p-3 text-sm text-foreground">{t.answer}</p>
            {t.policyFlags.length > 0 && <p className="text-xs text-amber-700">Policy flags: {t.policyFlags.join(", ")}</p>}
            {t.sources.length > 0 && (
              <ul className="space-y-1 text-xs text-foreground-muted">
                {t.sources.map((s, j) => <li key={j}><strong>[{j + 1}] {s.title}:</strong> {s.snippet}</li>)}
              </ul>
            )}
            {t.mode === "mock" && <p className="text-xs text-amber-700">Mode demo (tanpa OPENAI_API_KEY).</p>}
          </li>
        ))}
      </ul>
      <form action={formAction} className="space-y-2" onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        setLastQuestion(String(fd.get("question") ?? ""));
      }}>
        <textarea name="question" required minLength={3} rows={2} placeholder="Tanya apa saja dari knowledge base…" className={inputClassName} />
        <Button type="submit" disabled={pending}>{pending ? "Mencari…" : "Tanya"}</Button>
        {state.status !== "idle" && state.status !== "success" && <p className="text-sm text-red-600">{state.message}</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Implement the presentational page + stories**

```tsx
// apps/web/src/features/ai-business-agent/ai-business-agent-page.tsx
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { AiBusinessAgentChat } from "./ai-business-agent-chat";

export function AiBusinessAgentPage({ canUse, source }: { canUse: boolean; source: "mock" | "supabase" }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI Management" title="AI Business Agent"
        description="Tanya jawab internal yang dijawab dari knowledge base yang sudah dipublish." />
      {source === "mock" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Mode preview (mock). Agent aktif saat data mode = supabase.
        </div>
      )}
      {!canUse ? (
        <PermissionDeniedState />
      ) : (
        <DashboardCard title="Assistant" description="Jawaban selalu mengutip sumber & lewat policy guard.">
          <AiBusinessAgentChat />
        </DashboardCard>
      )}
    </div>
  );
}
```

```tsx
// apps/web/src/features/ai-business-agent/ai-business-agent-page.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AiBusinessAgentPage } from "./ai-business-agent-page";

const meta: Meta<typeof AiBusinessAgentPage> = {
  title: "AiBusinessAgent/AiBusinessAgentPage",
  component: AiBusinessAgentPage,
  args: { canUse: true, source: "supabase" },
};
export default meta;
type Story = StoryObj<typeof AiBusinessAgentPage>;
export const Ready: Story = {};
export const PermissionDenied: Story = { args: { canUse: false, source: "supabase" } };
export const MockPreview: Story = { args: { canUse: true, source: "mock" } };
```

> Verify `PageHeader`/`DashboardCard`/`PermissionDeniedState`/`Button` prop names against their real files (as in SP1 T16, `ErrorState` took `title`/`description`); adapt if needed.

- [ ] **Step 3: Wire the real page**

```tsx
// apps/web/src/app/settings/ai-management/business-agent/page.tsx
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDataMode } from "@/lib/env/app-mode";
import { AiBusinessAgentPage } from "@/features/ai-business-agent/ai-business-agent-page";

export const dynamic = "force-dynamic";

export default async function BusinessAgentSettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  const canUse = user?.permissions.includes("can_use_ai_business_agent") ?? false;
  const source = getDataMode() === "supabase" ? "supabase" : "mock";
  return <AiBusinessAgentPage canUse={canUse} source={source} />;
}
```

Remove the old `ModuleMockPage`/`modulePages` imports from THIS file only.

- [ ] **Step 4: Verify** — `npx --yes pnpm@11.3.0 --dir apps/web typecheck` and `lint` PASS; `npx --yes pnpm@11.3.0 --dir apps/web build` PASS (route wired); `npx --yes pnpm@11.3.0 --dir apps/web build-storybook` PASS; full unit suite `npx --yes pnpm@11.3.0 --dir apps/web test` no regression.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/features/ai-business-agent apps/web/src/app/settings/ai-management/business-agent/page.tsx
git commit -m "feat(web): AI business agent chat UI + wire real page"
```

---

## Task 5: E2E smoke, docs, full verification

**Files:**
- Create: `apps/web/tests/e2e/ai-business-agent.spec.ts`, `docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md`
- Modify: `docs/superpowers/specs/2026-07-14-ai-business-agent-knowledge-qa-design.md` (Status → Implemented + deviations)

- [ ] **Step 1: Write the e2e smoke**

```ts
// apps/web/tests/e2e/ai-business-agent.spec.ts
import { expect, test } from "@playwright/test";

test.describe("AI Business Agent", () => {
  test("renders heading and a safe state", async ({ page }) => {
    await page.goto("/settings/ai-management/business-agent");
    await expect(page.getByRole("heading", { name: "AI Business Agent" })).toBeVisible();
    const signal = await page.getByText(/Mode preview|Assistant|akses|Konfigurasi|Tanya/i).count();
    expect(signal).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run e2e** — a mock-mode dev server on `127.0.0.1:3100` must be running (Playwright reuses it via `reuseExistingServer`); if none, start one: `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock ./apps/web/node_modules/.bin/next.CMD dev --hostname 127.0.0.1 --port 3100` (background), wait for ready, then `npx --yes pnpm@11.3.0 --dir apps/web test:e2e -- ai-business-agent`. Expected: PASS. Note: in mock mode the page shows the "Mode preview" banner and (for a mock user without the permission) the permission-denied state — the tolerant regex covers both.

- [ ] **Step 3: Write the phase log + update spec status**

Create `docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md` (beginner-friendly): what was built (audit RPC + match-gate widening, `allowedKnowledgeScopes`, orchestrator+action, chat UI), the permission→scope safety rule, how to run (supabase mode; optional OPENAI_API_KEY else mock), and what's out of scope (Live Chat draft-replies, operational-data grounding, multi-turn memory). Set the spec Status to Implemented and add a "Deviations" note (owner_only gated concretely by `can_publish_knowledge`; audit via `record_ai_interaction` RPC; match-gate widened to include `can_use_ai_business_agent`).

- [ ] **Step 4: Full verification** — run and confirm all pass, paste output in the report:
```
npx --yes pnpm@11.3.0 --dir packages/domain test
npx --yes pnpm@11.3.0 --dir apps/web test
npx --yes pnpm@11.3.0 --dir apps/web typecheck
npx --yes pnpm@11.3.0 --dir apps/web lint
npx --yes pnpm@11.3.0 --dir apps/web build
npx --yes pnpm@11.3.0 --dir apps/web test:e2e -- ai-business-agent
```

- [ ] **Step 5: Commit**
```bash
git add apps/web/tests/e2e/ai-business-agent.spec.ts docs/PHASE_SP2A_AI_BUSINESS_AGENT_LOG.md docs/superpowers/specs/2026-07-14-ai-business-agent-knowledge-qa-design.md
git commit -m "test(web): AI business agent e2e smoke + docs"
```

---

## Self-review notes (author)

- **Spec coverage:** placeholder replacement (T4) · knowledge-only grounding via `rpcMatch(scopes)` (T3) · RBAC `can_use_ai_business_agent` (T3 + match-gate T1) · permission→scope mapping (T2 `allowedKnowledgeScopes`, applied T3) · policy guard always applied (T3) · audit via RPC (T1 + T3) · mock/openai parity + badge (T3/T4) · states/stories (T4) · tests + e2e (T2/T3/T5) · docs (T5). All spec sections map to a task.
- **Reuse:** `embedText`/`rpcMatch`/`answerFromContext`/`evaluateKnowledgeAnswer`/gateway mock are used unchanged from SP1; only the match RPC's permission gate is widened (additive, backward-compatible).
- **Type consistency:** `BusinessAgentQueryState` defined once (T3) and consumed by the action (T3) + chat (T4); `allowedKnowledgeScopes`/`businessAgentQueryInputSchema` names match across T2 producer and T3 consumer; audit action string `ai.business_agent.answered` matches between the metadata (T3) and the psql verify (T1).
- **Carry-forwards honored:** `vi.mock("server-only")` in the orchestrator test; `await createSupabaseServerClient()`; `npx pnpm` invocation; RPC embedding-as-string is internal to `rpcMatch` (unchanged).
- **Open items to verify during implementation:** exact shared-component prop names (T4); that a `can_use_ai_business_agent`-only user (e.g. `ai_agent_service`) is not needed for the psql verify (T1 uses studio_director, who holds the perm).
