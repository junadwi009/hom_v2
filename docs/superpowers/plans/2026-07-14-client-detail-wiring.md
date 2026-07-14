# Client Detail Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Client Management detail panel's decorative tabs and the list's fabricated columns/filters with real per-client data (appointments, packages, payments, clinical notes) loaded on demand, permission-gated, with honest states.

**Architecture:** The list stays light (search + status from core client fields). Selecting a client fires ONE `"use server"` action that aggregates only the sources the viewer may see and returns a `ClientDetail` object; the detail panel renders Overview/History/Notes tabs from it. No new tables — reads against existing repos + one new clinical-cases read repository.

**Tech Stack:** Next.js App Router, React (client components for interactive panel), TypeScript strict, Zod, Supabase repositories, Vitest. Run scripts with `npx --yes pnpm@11.3.0 --dir <pkg> <script>` (pnpm not on PATH). Domain vitest can run from `packages/domain` via `node ../../node_modules/vitest/vitest.mjs run`.

## Global Constraints

- No new tables or migrations; read against existing schema only. (spec §Principles)
- Business logic in server use-cases, not components; validate inputs with Zod; reads via repositories. (AGENTS.md)
- Every screen/tab has loading, empty, error, and permission-denied states where relevant; NO fake zero values. (AGENTS.md)
- Sensitive data gated server-side by its OWN permission: Total Spend requires `can_view_payments`; Notes require `can_view_clinical_cases` OR `can_manage_clinical_cases`. The client only receives what it may show. (spec §Decisions)
- Any web unit test that (transitively) imports a `server-only` module MUST add `vi.mock("server-only", () => ({}));` at the top (repo convention).
- `createSupabaseServerClient()` is async — `await` it before `.from/.rpc`.
- Follow house design system (Tailwind + shadcn/Radix + tokens + Motion.dev). No restyle beyond what the tab/card changes require.
- Contact fields (phone/email) are already masked upstream — render masked values; do not add a raw-contact getter.

---

### Task 1: Domain — clinical-cases read schema + types

**Files:**
- Create: `packages/domain/src/clinical-cases/schemas.ts`
- Create: `packages/domain/src/clinical-cases/types.ts`
- Create: `packages/domain/src/clinical-cases/index.ts`
- Modify: `packages/domain/src/index.ts` (add `export * from "./clinical-cases";`)
- Test: `packages/domain/tests/clinical-cases.test.ts`

**Interfaces:**
- Produces: `clientClinicalCaseSchema`, `ClientClinicalCase` (read shape), `clinicalCaseListByClientQuerySchema`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/domain/tests/clinical-cases.test.ts
import { describe, expect, it } from "vitest";
import {
  clientClinicalCaseSchema,
  clinicalCaseListByClientQuerySchema,
} from "../src/clinical-cases";

describe("clientClinicalCaseSchema", () => {
  it("parses a valid clinical case read row", () => {
    const parsed = clientClinicalCaseSchema.parse({
      id: "11111111-1111-1111-1111-111111111111",
      clientId: "22222222-2222-2222-2222-222222222222",
      title: "Lower back assessment",
      caseStatus: "open",
      severity: "moderate",
      summary: "Initial intake",
      openedOn: "2026-06-01",
    });
    expect(parsed.title).toBe("Lower back assessment");
    expect(parsed.summary).toBe("Initial intake");
  });

  it("allows a null summary", () => {
    const parsed = clientClinicalCaseSchema.parse({
      id: "11111111-1111-1111-1111-111111111111",
      clientId: "22222222-2222-2222-2222-222222222222",
      title: "Follow-up",
      caseStatus: "open",
      severity: "low",
      summary: null,
      openedOn: "2026-06-02",
    });
    expect(parsed.summary).toBeNull();
  });

  it("rejects an empty title", () => {
    expect(() =>
      clientClinicalCaseSchema.parse({
        id: "11111111-1111-1111-1111-111111111111",
        clientId: "22222222-2222-2222-2222-222222222222",
        title: "",
        caseStatus: "open",
        severity: "low",
        summary: null,
        openedOn: "2026-06-02",
      }),
    ).toThrow();
  });

  it("validates the list-by-client query", () => {
    const q = clinicalCaseListByClientQuerySchema.parse({
      clientId: "22222222-2222-2222-2222-222222222222",
    });
    expect(q.clientId).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/domain && node ../../node_modules/vitest/vitest.mjs run tests/clinical-cases.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the schemas, types, barrel**

```ts
// packages/domain/src/clinical-cases/schemas.ts
import { z } from "zod";

export const clientClinicalCaseSchema = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    caseStatus: z.string().trim().min(1).max(40),
    severity: z.string().trim().min(1).max(40),
    summary: z.string().trim().max(2000).nullable(),
    openedOn: z.string().trim().min(1),
  })
  .strict();

export const clinicalCaseListByClientQuerySchema = z
  .object({ clientId: z.string().uuid() })
  .strict();
```

```ts
// packages/domain/src/clinical-cases/types.ts
import type { z } from "zod";
import type {
  clientClinicalCaseSchema,
  clinicalCaseListByClientQuerySchema,
} from "./schemas";

export type ClientClinicalCase = z.infer<typeof clientClinicalCaseSchema>;
export type ClinicalCaseListByClientQuery = z.infer<
  typeof clinicalCaseListByClientQuerySchema
>;
```

```ts
// packages/domain/src/clinical-cases/index.ts
export * from "./schemas";
export * from "./types";
```

Add to `packages/domain/src/index.ts`: `export * from "./clinical-cases";`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/domain && node ../../node_modules/vitest/vitest.mjs run tests/clinical-cases.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/clinical-cases packages/domain/src/index.ts packages/domain/tests/clinical-cases.test.ts
git commit -m "feat(domain): clinical-cases read schema + types"
```

---

### Task 2: Clinical-cases read repository (Supabase)

**Files:**
- Create: `apps/web/src/lib/clinical-cases/supabase/clinical-case-repository.ts`
- Test: `apps/web/tests/unit/clinical-cases/clinical-case-repository.test.ts`

**Interfaces:**
- Consumes: `clientClinicalCaseSchema` (Task 1).
- Produces: `listClinicalCasesByClient(clientId: string, options?: { client?: ClinicalCaseQueryClient }): Promise<ClientClinicalCase[]>`. Pattern: mirror `apps/web/src/lib/clinical-cases/supabase/create-clinical-case.ts` (accepts an injectable client for tests; uses `createSupabaseServerClient()` by default). Direct table read: `.from("clinical_cases").select("id,client_id,title,case_status,severity,summary,opened_on").eq("client_id", clientId).order("opened_on", { ascending: false })`. Map snake→camel then `clientClinicalCaseSchema.parse`. RLS already restricts SELECT to clinical permissions, so an unauthorized caller simply gets `[]` at the DB layer (the loader in Task 4 decides granted vs restricted from the permission flag, not from row count).

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/tests/unit/clinical-cases/clinical-case-repository.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { listClinicalCasesByClient } from "@/lib/clinical-cases/supabase/clinical-case-repository";

function fakeClient(rows: unknown[] | null, error: unknown = null) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => Promise.resolve({ data: rows, error }),
  };
  return { from: () => builder };
}

describe("listClinicalCasesByClient", () => {
  it("maps rows to the domain read shape", async () => {
    const client = fakeClient([
      {
        id: "11111111-1111-1111-1111-111111111111",
        client_id: "22222222-2222-2222-2222-222222222222",
        title: "Lower back",
        case_status: "open",
        severity: "moderate",
        summary: "intake",
        opened_on: "2026-06-01",
      },
    ]);
    const result = await listClinicalCasesByClient(
      "22222222-2222-2222-2222-222222222222",
      { client: client as never },
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Lower back");
    expect(result[0].openedOn).toBe("2026-06-01");
  });

  it("returns [] when the query errors", async () => {
    const client = fakeClient(null, { message: "denied" });
    const result = await listClinicalCasesByClient("22222222-2222-2222-2222-222222222222", {
      client: client as never,
    });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --yes pnpm@11.3.0 --dir apps/web test -- clinical-case-repository`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the repository**

Mirror `create-clinical-case.ts`'s shape (import `"server-only"`, an injectable `ClinicalCaseQueryClient` type with `from(...)`, default to `await createSupabaseServerClient()`). Query as in Interfaces; on `error` or `!data` return `[]`; otherwise map each row `{id, client_id→clientId, title, case_status→caseStatus, severity, summary, opened_on→openedOn}` and `clientClinicalCaseSchema.parse`. Wrap the whole body in try/catch → `[]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --yes pnpm@11.3.0 --dir apps/web test -- clinical-case-repository`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/clinical-cases/supabase/clinical-case-repository.ts apps/web/tests/unit/clinical-cases/clinical-case-repository.test.ts
git commit -m "feat(clinical-cases): read repository listClinicalCasesByClient"
```

---

### Task 3: Client-detail view types

**Files:**
- Create: `apps/web/src/features/clients/management/client-detail-types.ts`

**Interfaces:**
- Produces (consumed by Tasks 4, 6):

```ts
import type { ClientClinicalCase } from "@hom/domain/clinical-cases";

export type MembershipSummary = {
  packageName: string;
  status: string;          // client_package status verbatim
  remainingSessions: number;
  totalSessions: number;
  expiresAt: string;
  active: boolean;
};

export type SpendSummary = {
  totalPaidIdr: number;
  lastPaymentAt: string | null;
};

export type ClientAppointmentRow = {
  id: string;
  startsAt: string;
  serviceName: string;
  practitionerName: string;
  status: string;          // scheduled|confirmed|completed|cancelled|no_show
};

export type ClientNotes =
  | { access: "granted"; cases: ClientClinicalCase[] }
  | { access: "restricted" };

export type ClientDetail = {
  clientId: string;
  membership: MembershipSummary | null;
  activity: { lastVisit: string | null; totalVisits: number };
  spend: SpendSummary | null;   // null when viewer lacks can_view_payments
  appointments: ClientAppointmentRow[];
  notes: ClientNotes;
};

export type ClientDetailResult =
  | { status: "ready"; detail: ClientDetail }
  | { status: "permission_denied" }
  | { status: "error" };
```

- [ ] **Step 1: Create the file exactly as above.**

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck`
Expected: clean (types only; `@hom/domain/clinical-cases` resolves from Task 1).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/clients/management/client-detail-types.ts
git commit -m "feat(clients): client-detail view types"
```

---

### Task 4: Client-detail server loader (aggregation + gating)

**Files:**
- Create: `apps/web/src/features/clients/management/client-detail-loader.ts`
- Test: `apps/web/tests/unit/clients/client-detail-loader.test.ts`

**Interfaces:**
- Consumes: `listClinicalCasesByClient` (Task 2); client-packages repo `.list({clientId})`, appointments repo `.list({clientId})`, payments repo `.list({clientId,status:"paid"})` via their repository factories; `getCurrentUser()` for permissions; view types (Task 3).
- Produces: `loadClientDetail(clientId: string, deps?: ClientDetailDeps): Promise<ClientDetailResult>` where `ClientDetailDeps` injects the four data-fetchers + a `permissions: string[]` for tests. The default implementation resolves `getCurrentUser()` then real repositories.

**Logic contract (test against these):**
- `spend`: only computed when `permissions` includes `can_view_payments`; else `null`. When computed, `totalPaidIdr` = sum of `amountIdr` over the paid payments; `lastPaymentAt` = max `paidAt` (or null).
- `notes`: `access:"granted"` with the fetched cases when `permissions` includes `can_view_clinical_cases` OR `can_manage_clinical_cases`; else `{access:"restricted"}` (and the clinical fetch is NOT called).
- `activity.totalVisits` = count of appointments with `status:"completed"`; `lastVisit` = max `startsAt` among completed (or null).
- `membership`: from the newest active client_package (or null when none).
- On any thrown error from the fetchers → `{status:"error"}`.

- [ ] **Step 1: Write the failing test** (inject deps; no Supabase)

```ts
// apps/web/tests/unit/clients/client-detail-loader.test.ts
import { describe, expect, it } from "vitest";
import { loadClientDetail } from "@/features/clients/management/client-detail-loader";

const baseDeps = {
  permissions: ["can_view_clients"],
  fetchPackages: async () => [],
  fetchAppointments: async () => [
    { id: "a1", startsAt: "2026-06-10T02:00:00Z", serviceName: "Reformer", practitionerName: "Dara", status: "completed" },
    { id: "a2", startsAt: "2026-06-20T02:00:00Z", serviceName: "Mat", practitionerName: "Dara", status: "completed" },
    { id: "a3", startsAt: "2026-07-01T02:00:00Z", serviceName: "Mat", practitionerName: "Dara", status: "scheduled" },
  ],
  fetchPaidPayments: async () => [
    { amountIdr: 300000, paidAt: "2026-06-10T03:00:00Z" },
    { amountIdr: 200000, paidAt: "2026-06-20T03:00:00Z" },
  ],
  fetchClinicalCases: async () => [{ id: "c1", title: "Back" }],
};

describe("loadClientDetail", () => {
  it("derives activity from completed appointments", async () => {
    const r = await loadClientDetail("client-1", baseDeps as never);
    expect(r.status).toBe("ready");
    if (r.status !== "ready") return;
    expect(r.detail.activity.totalVisits).toBe(2);
    expect(r.detail.activity.lastVisit).toBe("2026-06-20T02:00:00Z");
    expect(r.detail.appointments).toHaveLength(3);
  });

  it("hides spend without can_view_payments", async () => {
    const r = await loadClientDetail("client-1", baseDeps as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.spend).toBeNull();
  });

  it("sums spend when permitted", async () => {
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      permissions: ["can_view_clients", "can_view_payments"],
    } as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.spend?.totalPaidIdr).toBe(500000);
    expect(r.detail.spend?.lastPaymentAt).toBe("2026-06-20T03:00:00Z");
  });

  it("restricts notes without clinical permission and skips the fetch", async () => {
    let called = false;
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      fetchClinicalCases: async () => {
        called = true;
        return [];
      },
    } as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.notes.access).toBe("restricted");
    expect(called).toBe(false);
  });

  it("grants notes with can_view_clinical_cases", async () => {
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      permissions: ["can_view_clients", "can_view_clinical_cases"],
    } as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.notes.access).toBe("granted");
  });

  it("returns error when a fetcher throws", async () => {
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      fetchAppointments: async () => {
        throw new Error("boom");
      },
    } as never);
    expect(r.status).toBe("error");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --yes pnpm@11.3.0 --dir apps/web test -- client-detail-loader`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `loadClientDetail`**

Pure orchestration over injected `deps` (the test contract above). Structure:
```
export type ClientDetailDeps = {
  permissions: string[];
  fetchPackages: (clientId) => Promise<Array<{packageName;status;remainingSessions;totalSessions;expiresAt;active}>>;
  fetchAppointments: (clientId) => Promise<ClientAppointmentRow[]>;
  fetchPaidPayments: (clientId) => Promise<Array<{amountIdr:number; paidAt:string|null}>>;
  fetchClinicalCases: (clientId) => Promise<ClientClinicalCase[]>;
};
```
- Wrap body in try/catch → `{status:"error"}`.
- `canPayments = permissions.includes("can_view_payments")`.
- `canClinical = permissions.includes("can_view_clinical_cases") || permissions.includes("can_manage_clinical_cases")`.
- Only await `fetchPaidPayments` if `canPayments`; only await `fetchClinicalCases` if `canClinical`.
- Derive `activity`, `membership` (first active, else first, else null), `spend`, `notes` per contract.
- Provide a default `deps` builder (NOT under test) that: `await getCurrentUser()` → permissions (empty if null); builds fetchers from the real repos (`createPackageRepositories().clientPackages.list({clientId})`, appointments/payments factories, `listClinicalCasesByClient`). Map each repo row into the small fetcher shapes. Export `loadClientDetail(clientId)` that calls the internal impl with the default deps.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --yes pnpm@11.3.0 --dir apps/web test -- client-detail-loader`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clients/management/client-detail-loader.ts apps/web/tests/unit/clients/client-detail-loader.test.ts
git commit -m "feat(clients): client-detail aggregation loader with permission gating"
```

---

### Task 5: Client-detail server action

**Files:**
- Create: `apps/web/src/features/clients/management/load-client-detail-action.ts`
- Test: `apps/web/tests/unit/clients/load-client-detail-action.test.ts`

**Interfaces:**
- Consumes: `loadClientDetail` (Task 4).
- Produces: `loadClientDetailAction(clientId: string): Promise<ClientDetailResult>` — a `"use server"` module. Validates `clientId` with `z.string().uuid()`; on invalid input returns `{status:"error"}`; otherwise delegates to `loadClientDetail`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/tests/unit/clients/load-client-detail-action.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/features/clients/management/client-detail-loader", () => ({
  loadClientDetail: vi.fn(async () => ({ status: "ready", detail: { clientId: "x" } })),
}));

import { loadClientDetailAction } from "@/features/clients/management/load-client-detail-action";

describe("loadClientDetailAction", () => {
  it("returns error for a non-uuid clientId", async () => {
    const r = await loadClientDetailAction("not-a-uuid");
    expect(r.status).toBe("error");
  });
  it("delegates for a valid uuid", async () => {
    const r = await loadClientDetailAction("22222222-2222-2222-2222-222222222222");
    expect(r.status).toBe("ready");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --yes pnpm@11.3.0 --dir apps/web test -- load-client-detail-action`
Expected: FAIL.

- [ ] **Step 3: Implement the action**

```ts
"use server";
import { z } from "zod";
import { loadClientDetail } from "./client-detail-loader";
import type { ClientDetailResult } from "./client-detail-types";

const clientIdSchema = z.string().uuid();

export async function loadClientDetailAction(clientId: string): Promise<ClientDetailResult> {
  const parsed = clientIdSchema.safeParse(clientId);
  if (!parsed.success) return { status: "error" };
  return loadClientDetail(parsed.data);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --yes pnpm@11.3.0 --dir apps/web test -- load-client-detail-action`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clients/management/load-client-detail-action.ts apps/web/tests/unit/clients/load-client-detail-action.test.ts
git commit -m "feat(clients): loadClientDetailAction server action"
```

---

### Task 6: Rewrite the detail panel (real tabs + states)

**Files:**
- Modify: `apps/web/src/features/clients/management/client-detail-panel.tsx`
- Create: `apps/web/src/features/clients/management/client-detail-panel.stories.tsx`

**Interfaces:**
- Consumes: `loadClientDetailAction` (Task 5), view types (Task 3), `ClientTabs` (existing), `client` light identity (name/status/initials) from the list.

**Behaviour:**
- Props: `{ client: { id: string; name: string; initials: string; status: string; vip?: boolean } }`.
- On mount and whenever `client.id` changes: call `loadClientDetailAction(client.id)` inside a `useEffect` guarded against stale responses (track the requested id; ignore a resolved response whose id no longer matches). Track `state: "loading" | ClientDetailResult`.
- Tabs via `ClientTabs tabs={["Overview","History","Notes"]} onChange={setActiveTab}` (NO Communication).
- **Overview tab:** Membership card (or "Belum ada membership" empty state when `membership` null); Activity card (last visit + total visits, "—"/0 honest when none); Total Spend card rendered ONLY when `spend !== null` (omitted entirely otherwise).
- **History tab:** list of `appointments` (date · service · practitioner · status badge); empty state "Belum ada kunjungan" when empty.
- **Notes tab:** when `notes.access === "restricted"` show an "Akses terbatas — butuh izin Clinical" panel; when granted, list cases (title · status · severity · openedOn · summary) or "Belum ada catatan" empty state.
- Loading: skeleton blocks sized to the cards (not a spinner). Error: inline "Gagal memuat detail klien." Permission_denied: "Anda tidak memiliki akses ke detail klien ini."
- DELETE the fabricated Health Score / Alasan Risiko / AI Recommendation blocks and the `ScoreRing`/`Sparkles` usages tied to them (remove now-unused imports). `healthLabel` helper is removed.

- [ ] **Step 1: Rewrite `client-detail-panel.tsx`** per the behaviour above (`"use client"`, `useEffect` + `useState`, stale-guard). Keep the header (avatar/name/status/VIP). Reuse existing `Badge` for statuses.

- [ ] **Step 2: Add stories** covering: loading, ready (spend visible), ready (spend hidden), notes-restricted, history-empty, error. Use static `ClientDetail` fixtures passed to a presentational sub-component if you extract one; otherwise mock the action in the story. Match the pattern of `apps/web/src/features/clients/management/client-management-page.stories.tsx` if present, else the nearest existing `*.stories.tsx`.

- [ ] **Step 3: Typecheck + build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/clients/management/client-detail-panel.tsx apps/web/src/features/clients/management/client-detail-panel.stories.tsx
git commit -m "feat(clients): real client detail panel (Overview/History/Notes tabs, gated)"
```

---

### Task 7: Simplify the list (type, loader, table)

**Files:**
- Modify: `apps/web/src/features/clients/management/management-data.ts` (`ManagedClient` type + `ClientStatus`)
- Modify: `apps/web/src/features/clients/management/managed-clients-loader.ts`
- Modify: `apps/web/src/features/clients/management/client-table.tsx`
- Modify: `apps/web/src/features/clients/management/client-management-page.tsx` (detail panel prop)

**Goal:** the list carries only real, cheap fields. Detail comes from Task 6.

- [ ] **Step 1: Trim `ManagedClient`** to what the list + detail header need:
```ts
export type ClientStatus = "Active" | "Trial" | "Dormant";
export type ManagedClient = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  status: ClientStatus;
  vip?: boolean;
};
```
Remove `RiskLevel`, membership/lastVisit/nextBooking/riskLevel/totalSpend/healthScore/riskReasons/membership/activity/spend/aiRecommendation fields. Delete the now-unused mock `managedClients`/`managementKpis`/`managementInsights` bodies ONLY if nothing else imports them after this task (grep; the mock-mode branch in the page may still use `managedClients` + `managementKpis` + `managementInsights` — if so, trim those fixtures to the new shape instead of deleting).

- [ ] **Step 2: Simplify `managed-clients-loader.ts`** — `mapClientToManaged` returns only `{id, name, phone: client.maskedPhone ?? "—", initials, status: statusMap[client.status]}`. Keep `statusMap` (active→Active, prospect→Trial, inactive/archived→Dormant). Remove all placeholder fields.

- [ ] **Step 3: Trim `client-table.tsx`** columns to real data: keep Client (avatar/name/VIP + phone) and Status; REMOVE the Membership, Last Visit, Next Booking, Risk, Total Spend columns (both `<th>` and `<td>`). Remove `riskTone`/`statusTone` entries for removed values as needed and any now-unused imports. The row still `onClick={() => onSelect(client.id)}` to open the detail panel.

- [ ] **Step 4: Update `client-management-page.tsx`** — pass the light identity to `ClientDetailPanel` (`client={{ id, name, initials, status, vip }}`); the panel now self-loads its detail. The `buildRealKpiCards` KPIs stay (they use the separate `management-kpis-loader`). Ensure `visibleClients` filter still compiles (it references `client.status`; `riskLevel` reference must be removed — see Task 8).

- [ ] **Step 5: Typecheck + build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: clean. Fix any consumer of removed fields the typechecker flags.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/clients/management
git commit -m "refactor(clients): light client list (real fields only), detail loads on demand"
```

---

### Task 8: Trim the filters to what works

**Files:**
- Modify: `apps/web/src/features/clients/management/management-data.ts` (`managementFilters`)
- Modify: `apps/web/src/features/clients/management/client-management-page.tsx` (filter state + handlers)

- [ ] **Step 1: Reduce `managementFilters`** to a single working filter:
```ts
export const managementFilters = [
  { label: "Status", options: ["Semua", "Active", "Trial", "Dormant"] },
];
```

- [ ] **Step 2: Trim page filter logic** — remove `riskFilter` state, the `Risk Level` branch in `handleFilterChange`, and the `matchesRisk` clause in `visibleClients`. Keep `query` (search) + `statusFilter`. `handleFilterChange` keeps only the `Status` branch. `handleReset` resets query + statusFilter only.

- [ ] **Step 3: Typecheck + build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: clean.

- [ ] **Step 4: Verify only real filters remain**

Run: `grep -nE "Membership|Last Visit|Risk Level|Tag|riskFilter|matchesRisk" apps/web/src/features/clients/management/client-management-page.tsx apps/web/src/features/clients/management/management-data.ts`
Expected: no matches (all removed).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clients/management
git commit -m "refactor(clients): keep only wired filters (Search + Status)"
```

---

### Task 9: Verification gate + stale-test sweep

**Files:**
- Modify: any client-management unit test / story that asserted removed fields/filters.

- [ ] **Step 1: Run the full gate**

```bash
npx --yes pnpm@11.3.0 --dir packages/domain test
npx --yes pnpm@11.3.0 --dir apps/web test
npx --yes pnpm@11.3.0 --dir apps/web typecheck
npx --yes pnpm@11.3.0 --dir apps/web lint
npx --yes pnpm@11.3.0 --dir apps/web build
```
Expected: all green.

- [ ] **Step 2: Fix stale assertions**

If any unit test / story fails because it asserted a removed field (riskLevel, membership placeholder, removed filters, ManagedClient old shape), update it to the new reality. Do NOT change product code to satisfy a stale test; do NOT weaken a real assertion. If a failure looks like a real regression, STOP and report it.

- [ ] **Step 3: Manual check (supabase mode, seeded studio director)**

Dev server running, logged in: open Clients → select a client → Overview shows real membership/activity (+ spend, since director has payments perm); History lists real appointments; Notes shows clinical cases or an empty state (director has clinical perms) — switch tabs and confirm content changes; the Status filter and search narrow the list; there is NO Communication tab, and NO Membership/Last-Visit/Risk/Tag filters. If Playwright is available, run any clients e2e; otherwise record this manual pass.

- [ ] **Step 4: Commit any test updates**

```bash
git add -A apps/web/tests apps/web/src/features/clients
git commit -m "test(clients): align tests/stories with wired client detail"
```

---

## Notes for the executor

- Task order matters: 1→2→3 (domain/types/repo) before 4 (loader) before 5 (action) before 6 (panel). 7 and 8 (list/filter trims) depend on 3/6 being in place and can be done after 6; 9 is last.
- The loader (Task 4) is the heart — its dependency-injection seam is what makes the gating testable without Supabase. Keep the default-deps builder thin and untested; all logic lives in the injected-deps path that the tests exercise.
- Do not add a raw-contact getter, a risk/health model, a messages backend, or a client↔tag table — all explicitly out of scope (spec §Non-goals).
