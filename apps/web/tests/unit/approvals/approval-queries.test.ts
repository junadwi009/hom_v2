import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  fetchApprovalRequests,
  fetchApprovalRules,
  type ApprovalQueryClient,
} from "../../../src/lib/approvals/supabase/approval-queries";

type Rows = Record<string, unknown>[];

function createFakeClient(
  data: Rows | null,
  error: unknown = null,
): ApprovalQueryClient {
  return {
    rpc() {
      return Promise.resolve({ data, error });
    },
  } as unknown as ApprovalQueryClient;
}

function createThrowingClient(): ApprovalQueryClient {
  return {
    rpc() {
      throw new Error("network down");
    },
  } as unknown as ApprovalQueryClient;
}

const baseRow = {
  id: "r1",
  request_number: "APR-00001",
  title: "Refund pembayaran",
  request_type: "reimbursement",
  domain: "financial",
  status: "pending",
  risk: "high",
  requested_by: "u1",
  requester_name: "Maya",
  requester_role: "finance_admin",
  approver_id: null,
  approver_name: null,
  approver_role: null,
  branch_id: null,
  branch_name: null,
  related_module: "payments",
  related_record_id: null,
  related_record_label: "PAY-1",
  client_id: null,
  client_name: null,
  impact_label: "Refund",
  amount_idr: 2_400_000,
  reason: "Kelas dibatalkan",
  risk_check: null,
  sensitive: false,
  requires_second_approval: true,
  waiting_hours: "5.4",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  resolved_at: null,
  events: [],
  evidence: [],
};

describe("fetchApprovalRequests", () => {
  it("maps rows on success", async () => {
    const result = await fetchApprovalRequests({
      client: createFakeClient([baseRow]),
    });
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({
      id: "r1",
      title: "Refund pembayaran",
      domain: "financial",
      status: "pending",
      risk: "high",
      amountIdr: 2_400_000,
      requiresSecondApproval: true,
      waitingHours: 5,
    });
  });

  it("returns an empty list when the query succeeds with no rows", async () => {
    expect(
      await fetchApprovalRequests({ client: createFakeClient([]) }),
    ).toEqual([]);
  });

  it("returns null (not an empty list) when the RPC reports an error", async () => {
    expect(
      await fetchApprovalRequests({
        client: createFakeClient(null, new Error("boom")),
      }),
    ).toBeNull();
  });

  it("returns null when the client throws", async () => {
    expect(
      await fetchApprovalRequests({ client: createThrowingClient() }),
    ).toBeNull();
  });
});

describe("fetchApprovalRules", () => {
  it("returns null on error instead of an empty list", async () => {
    expect(
      await fetchApprovalRules({
        client: createFakeClient(null, new Error("boom")),
      }),
    ).toBeNull();
  });

  it("maps rules on success", async () => {
    const rules = await fetchApprovalRules({
      client: createFakeClient([
        {
          id: "rule1",
          action_type: "reimbursement",
          domain: "financial",
          condition_label: "> Rp 1jt",
          approver_role: "finance_admin",
          risk: "high",
          is_active: true,
        },
      ]),
    });
    expect(rules?.[0]).toMatchObject({
      id: "rule1",
      actionType: "reimbursement",
      approverRole: "finance_admin",
      isActive: true,
    });
  });
});
