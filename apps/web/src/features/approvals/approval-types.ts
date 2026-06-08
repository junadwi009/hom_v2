// Approval Center domain types. This phase is UI + typed local/mock data only;
// no Supabase/RPC yet. Shapes are designed so a future backend can map 1:1.
// See docs/implementation-logs/FINANCIALS_APPROVALS_IMPLEMENTATION_LOG.md
// ("Future real approval engine") for the planned tables/RPCs.

export type ApprovalDomain =
  | "financial"
  | "client_membership"
  | "booking"
  | "clinical"
  | "team"
  | "marketing"
  | "admin_governance";

export type ApprovalStatus =
  | "draft"
  | "pending"
  | "need_more_info"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "auto_approved"
  | "escalated";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ApprovalEvidenceType =
  | "receipt"
  | "invoice"
  | "screenshot"
  | "document"
  | "note"
  | "diff"
  | "campaign_preview";

export type ApprovalParty = {
  id: string;
  name: string;
  role: string;
};

export type ApprovalEvidence = {
  id: string;
  label: string;
  type: ApprovalEvidenceType;
};

export type ApprovalHistoryEvent = {
  id: string;
  action: string; // "created" | "viewed" | "approved" | "rejected" | "need_more_info" | "escalated"
  actorName: string;
  timestamp: string; // ISO
  note?: string;
};

export type ApprovalRequest = {
  id: string;
  title: string;
  type: string; // e.g. "refund", "whatsapp_blast", "note_unlock"
  domain: ApprovalDomain;
  requestedBy: ApprovalParty;
  requestedAt: string; // ISO
  approver: ApprovalParty;
  relatedModule: string; // e.g. "payments", "clinical_cases"
  relatedRoute?: string;
  relatedRecordId?: string;
  relatedRecordLabel: string;
  clientName?: string;
  branch: string;
  impactLabel: string;
  amountIdr?: number;
  risk: RiskLevel;
  status: ApprovalStatus;
  waitingHours: number;
  reason: string;
  evidence: ApprovalEvidence[];
  riskCheck: string;
  sensitive?: boolean;
  requiresSecondApproval?: boolean;
  history: ApprovalHistoryEvent[];
};

export type ApprovalRule = {
  id: string;
  actionType: string;
  condition: string;
  approverRole: string;
  risk: RiskLevel;
  isActive: boolean;
};
