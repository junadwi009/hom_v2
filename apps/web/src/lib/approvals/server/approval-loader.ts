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
};

// Loads the Approval Center data. In Supabase data mode it reads real, persisted
// requests/rules via the RPCs; otherwise it reports "mock" so the page can fall
// back to the labeled local seed.
export async function loadApprovalCenterData(): Promise<ApprovalCenterData> {
  if (getDataMode() !== "supabase") {
    return { source: "mock", requests: [], rules: [] };
  }
  const [requests, rules] = await Promise.all([
    fetchApprovalRequests(),
    fetchApprovalRules(),
  ]);
  return { source: "supabase", requests, rules };
}
