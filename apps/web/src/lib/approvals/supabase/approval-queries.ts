import "server-only";

import type {
  ApprovalDomain,
  ApprovalEvidence,
  ApprovalHistoryEvent,
  ApprovalRequest,
  ApprovalRule,
  ApprovalStatus,
  RiskLevel,
} from "@/features/approvals/approval-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Raw row shape returned by list_approval_requests (the private view row).
type ApprovalRequestRpcRow = {
  id: string;
  request_number: string;
  title: string;
  request_type: string;
  domain: string;
  status: string;
  risk: string;
  requested_by: string | null;
  requester_name: string | null;
  requester_role: string | null;
  approver_id: string | null;
  approver_name: string | null;
  approver_role: string | null;
  branch_id: string | null;
  branch_name: string | null;
  related_module: string | null;
  related_record_id: string | null;
  related_record_label: string | null;
  client_id: string | null;
  client_name: string | null;
  impact_label: string | null;
  amount_idr: number | null;
  reason: string | null;
  risk_check: string | null;
  sensitive: boolean;
  requires_second_approval: boolean;
  waiting_hours: number | string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  events: ApprovalHistoryEvent[] | null;
  evidence: ApprovalEvidence[] | null;
};

type ApprovalRuleRpcRow = {
  id: string;
  action_type: string;
  domain: string;
  condition_label: string;
  approver_role: string;
  risk: string;
  is_active: boolean;
};

type ApprovalQueryClient = {
  rpc(
    fn: "list_approval_requests",
    params: { p_limit?: number; p_status?: string | null; p_domain?: string | null },
  ): PromiseLike<{ data: ApprovalRequestRpcRow[] | null; error: unknown }>;
  rpc(
    fn: "list_approval_rules",
    params?: Record<string, never>,
  ): PromiseLike<{ data: ApprovalRuleRpcRow[] | null; error: unknown }>;
};

const DOMAINS: ApprovalDomain[] = [
  "financial",
  "client_membership",
  "booking",
  "clinical",
  "team",
  "marketing",
  "admin_governance",
];
const STATUSES: ApprovalStatus[] = [
  "draft",
  "pending",
  "need_more_info",
  "approved",
  "rejected",
  "cancelled",
  "expired",
  "auto_approved",
  "escalated",
];
const RISKS: RiskLevel[] = ["low", "medium", "high", "critical"];

function asDomain(value: string): ApprovalDomain {
  return DOMAINS.includes(value as ApprovalDomain)
    ? (value as ApprovalDomain)
    : "admin_governance";
}
function asStatus(value: string): ApprovalStatus {
  return STATUSES.includes(value as ApprovalStatus)
    ? (value as ApprovalStatus)
    : "pending";
}
function asRisk(value: string): RiskLevel {
  return RISKS.includes(value as RiskLevel) ? (value as RiskLevel) : "medium";
}

// Map a stored related_module to the in-app route the UI navigates to.
function relatedRouteFor(module: string | null): string | undefined {
  switch (module) {
    case "payments":
      return "/payments";
    case "clinical_cases":
      return "/clinical-cases";
    case "clients":
      return "/clients";
    case "financials":
      return "/financials";
    case "appointments":
      return "/appointments";
    default:
      return undefined;
  }
}

export function mapRowToApprovalRequest(
  row: ApprovalRequestRpcRow,
): ApprovalRequest {
  return {
    id: row.id,
    title: row.title,
    type: row.request_type,
    domain: asDomain(row.domain),
    requestedBy: {
      id: row.requested_by ?? "",
      name: row.requester_name ?? "Pengguna",
      role: row.requester_role ?? "",
    },
    requestedAt: row.created_at,
    approver: {
      id: row.approver_id ?? "",
      name: row.approver_name ?? "—",
      role: row.approver_role ?? "",
    },
    relatedModule: row.related_module ?? "",
    relatedRoute: relatedRouteFor(row.related_module),
    relatedRecordId: row.related_record_id ?? undefined,
    relatedRecordLabel: row.related_record_label ?? "",
    clientName: row.client_name ?? undefined,
    branch: row.branch_name ?? "Semua Cabang",
    impactLabel: row.impact_label ?? "",
    amountIdr: row.amount_idr ?? undefined,
    risk: asRisk(row.risk),
    status: asStatus(row.status),
    waitingHours:
      row.waiting_hours == null ? 0 : Math.round(Number(row.waiting_hours)),
    reason: row.reason ?? "",
    evidence: Array.isArray(row.evidence) ? row.evidence : [],
    riskCheck: row.risk_check ?? "",
    sensitive: row.sensitive,
    requiresSecondApproval: row.requires_second_approval,
    history: Array.isArray(row.events) ? row.events : [],
  };
}

function mapRowToApprovalRule(row: ApprovalRuleRpcRow): ApprovalRule {
  return {
    id: row.id,
    actionType: row.action_type,
    condition: row.condition_label,
    approverRole: row.approver_role,
    risk: asRisk(row.risk),
    isActive: row.is_active,
  };
}

// Loads real approval requests from Supabase. Returns [] on any failure so the
// page can render an empty state rather than crash.
export async function fetchApprovalRequests(): Promise<ApprovalRequest[]> {
  try {
    const supabase =
      (await createSupabaseServerClient()) as unknown as ApprovalQueryClient;
    const { data, error } = await supabase.rpc("list_approval_requests", {
      p_limit: 200,
      p_status: null,
      p_domain: null,
    });
    if (error || !data) {
      return [];
    }
    return data.map(mapRowToApprovalRequest);
  } catch {
    return [];
  }
}

export async function fetchApprovalRules(): Promise<ApprovalRule[]> {
  try {
    const supabase =
      (await createSupabaseServerClient()) as unknown as ApprovalQueryClient;
    const { data, error } = await supabase.rpc("list_approval_rules");
    if (error || !data) {
      return [];
    }
    return data.map(mapRowToApprovalRule);
  } catch {
    return [];
  }
}
