import "server-only";

import type {
  ApprovalRequest,
  ApprovalRule,
} from "@/features/approvals/approval-types";
import {
  fetchApprovalRequests,
  fetchApprovalRules,
} from "@/lib/approvals/supabase/approval-queries";
import { getDataMode } from "@/lib/env/app-mode";

export type ApprovalDataSource = "supabase" | "mock";

export type ApprovalCenterData = {
  source: ApprovalDataSource;
  requests: ApprovalRequest[];
  rules: ApprovalRule[];
  // True when the request list could not be loaded (network/RPC failure).
  // The page must show an error state, not an empty worklist / zero KPIs.
  loadFailed: boolean;
};

// Loads the Approval Center data. In Supabase data mode it reads real, persisted
// requests/rules via the RPCs; otherwise it reports "mock" so the page can fall
// back to the labeled local seed.
export async function loadApprovalCenterData(): Promise<ApprovalCenterData> {
  if (getDataMode() !== "supabase") {
    return { source: "mock", requests: [], rules: [], loadFailed: false };
  }
  const [requests, rules] = await Promise.all([
    fetchApprovalRequests(),
    fetchApprovalRules(),
  ]);
  return {
    source: "supabase",
    requests: requests ?? [],
    rules: rules ?? [],
    loadFailed: requests === null,
  };
}
