import { formatCompactIDR } from "@/lib/format";

import type {
  ApprovalDomain,
  ApprovalRequest,
  ApprovalStatus,
  RiskLevel,
} from "./approval-types";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

// ---- Labels & tones --------------------------------------------------------

export const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: "Draft",
  pending: "Menunggu",
  need_more_info: "Butuh Info",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  auto_approved: "Auto-approved",
  escalated: "Dieskalasi",
};

const STATUS_TONES: Record<ApprovalStatus, BadgeTone> = {
  draft: "neutral",
  pending: "warning",
  need_more_info: "info",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "neutral",
  auto_approved: "success",
  escalated: "warning",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  critical: "Kritis",
};

const RISK_TONES: Record<RiskLevel, BadgeTone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export const DOMAIN_LABELS: Record<ApprovalDomain, string> = {
  financial: "Financial",
  client_membership: "Client & Membership",
  booking: "Booking",
  clinical: "Clinical",
  team: "Team",
  marketing: "Marketing",
  admin_governance: "Admin & Governance",
};

export function getApprovalStatusLabel(status: ApprovalStatus): string {
  return STATUS_LABELS[status];
}
export function getApprovalStatusBadgeTone(status: ApprovalStatus): BadgeTone {
  return STATUS_TONES[status];
}
export function getRiskLabel(risk: RiskLevel): string {
  return RISK_LABELS[risk];
}
export function getRiskBadgeTone(risk: RiskLevel): BadgeTone {
  return RISK_TONES[risk];
}

// Active = still actionable.
export const ACTIVE_STATUSES: ApprovalStatus[] = [
  "pending",
  "need_more_info",
  "escalated",
];
export function isActiveStatus(status: ApprovalStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

// ---- Permission awareness --------------------------------------------------

export type CurrentApprovalUser = {
  id: string;
  name: string;
  roles: string[];
  permissions: string[];
};

const OWNER_ROLES = ["super_admin", "studio_director"];

export function isOwner(user: CurrentApprovalUser): boolean {
  return user.roles.some((role) => OWNER_ROLES.includes(role));
}

// Map a request type to its primary required permission (if any).
const TYPE_PERMISSION: Record<string, string> = {
  whatsapp_blast: "can_approve_whatsapp_blast",
  note_unlock: "can_approve_note_unlock",
  reimbursement: "can_approve_reimbursements",
  publish_knowledge: "can_publish_knowledge",
  export_financial_report: "can_export_financial_report",
  client_data_export: "can_export_financial_report",
  role_assignment: "can_manage_roles_permissions",
  hard_delete: "can_manage_users",
  branch_change: "can_manage_users",
  branch_open_close: "can_manage_users",
  production_integration: "can_manage_users",
};

// Can the current user approve this request?
export function canApproveRequest(
  user: CurrentApprovalUser,
  request: ApprovalRequest,
): boolean {
  if (isOwner(user)) return true;
  const explicit = TYPE_PERMISSION[request.type];
  if (explicit) return user.permissions.includes(explicit);
  if (request.domain === "financial") {
    return (
      user.permissions.includes("can_approve_reimbursements") ||
      user.permissions.includes("can_edit_financials")
    );
  }
  if (request.domain === "clinical") {
    return user.permissions.includes("can_approve_note_unlock");
  }
  // Default: management-level users.
  return user.permissions.includes("can_manage_users");
}

// Can the current user see sensitive clinical details?
export function canViewSensitive(
  user: CurrentApprovalUser,
  request: ApprovalRequest,
): boolean {
  if (!request.sensitive) return true;
  if (isOwner(user)) return true;
  return (
    user.permissions.includes("can_view_clinical_cases") ||
    user.permissions.includes("can_approve_note_unlock")
  );
}

// Broad gate: can the user open the Approval Center at all?
const VIEWER_PERMISSIONS = [
  "can_manage_users",
  "can_manage_roles_permissions",
  "can_edit_financials",
  "can_view_financials",
  "can_manage_clients",
  "can_manage_appointments",
  "can_manage_practitioners",
  "can_approve_reimbursements",
  "can_approve_whatsapp_blast",
  "can_approve_note_unlock",
  "can_publish_knowledge",
];
export function canAccessApprovalCenter(user: CurrentApprovalUser): boolean {
  return isOwner(user) || user.permissions.some((p) => VIEWER_PERMISSIONS.includes(p));
}

// ---- KPIs ------------------------------------------------------------------

export type ApprovalKpis = {
  pending: number;
  urgent: number;
  financialImpact: number;
  clinicalReview: number;
  overdue: number;
  approvedThisMonth: number;
};

export function computeApprovalKpis(
  requests: ApprovalRequest[],
): ApprovalKpis {
  const active = requests.filter((r) => isActiveStatus(r.status));
  return {
    pending: requests.filter((r) => r.status === "pending").length,
    urgent: active.filter((r) => r.risk === "high" || r.risk === "critical").length,
    financialImpact: active.reduce((sum, r) => sum + (r.amountIdr ?? 0), 0),
    clinicalReview: active.filter((r) => r.domain === "clinical").length,
    overdue: active.filter((r) => r.waitingHours > 24).length,
    approvedThisMonth: requests.filter(
      (r) => r.status === "approved" || r.status === "auto_approved",
    ).length,
  };
}

// ---- Prioritisation & insight ----------------------------------------------

const RISK_WEIGHT: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 5,
};

export function getPriorityRequests(
  requests: ApprovalRequest[],
): ApprovalRequest[] {
  return requests
    .filter((r) => isActiveStatus(r.status))
    .map((r) => {
      let score = RISK_WEIGHT[r.risk] * 10;
      if (r.amountIdr && r.amountIdr >= 1_000_000) score += 6;
      if (r.waitingHours > 24) score += 4;
      if (r.domain === "clinical") score += 3;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

// Pick the single request that should be focused first when the center opens.
// Priority order (as specified): critical risk > overdue (>24h) > highest
// financial impact > pending. Only actionable requests are considered; returns
// null when there is nothing to act on (so the empty state is preserved).
export function compareApprovalPriority(
  a: ApprovalRequest,
  b: ApprovalRequest,
): number {
  const critical =
    Number(b.risk === "critical") - Number(a.risk === "critical");
  if (critical !== 0) return critical;

  const overdue = Number(b.waitingHours > 24) - Number(a.waitingHours > 24);
  if (overdue !== 0) return overdue;

  const impact = (b.amountIdr ?? 0) - (a.amountIdr ?? 0);
  if (impact !== 0) return impact;

  const pending = Number(b.status === "pending") - Number(a.status === "pending");
  if (pending !== 0) return pending;

  // Stable tie-break: longest-waiting first, then id for determinism.
  if (b.waitingHours !== a.waitingHours) return b.waitingHours - a.waitingHours;
  return a.id.localeCompare(b.id);
}

export function getHighestPriorityRequest(
  requests: ApprovalRequest[],
): ApprovalRequest | null {
  const active = requests.filter((r) => isActiveStatus(r.status));
  if (active.length === 0) return null;
  return [...active].sort(compareApprovalPriority)[0];
}

export function generateApprovalInsight(requests: ApprovalRequest[]): {
  text: string;
  top: ApprovalRequest[];
} {
  const priority = getPriorityRequests(requests);
  const top = priority.slice(0, 3);
  const highRisk = priority.filter(
    (r) => r.risk === "high" || r.risk === "critical",
  ).length;

  if (priority.length === 0) {
    return {
      text: "Tidak ada permintaan approval yang menunggu. Semua sudah ditindaklanjuti.",
      top,
    };
  }

  const finImpact = requests
    .filter((r) => isActiveStatus(r.status))
    .reduce((s, r) => s + (r.amountIdr ?? 0), 0);

  const text =
    `Ada ${priority.length} request menunggu` +
    (highRisk > 0 ? `, ${highRisk} di antaranya berisiko tinggi` : "") +
    (finImpact > 0 ? ` dengan total dampak finansial ${formatCompactIDR(finImpact)}` : "") +
    `. Prioritaskan ${top.map((r) => r.title).join(", ")}.`;

  return { text, top };
}
