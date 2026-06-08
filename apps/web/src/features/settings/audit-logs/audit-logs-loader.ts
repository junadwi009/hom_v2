import "server-only";

import { listAuditLogs } from "@/lib/audit/supabase/list-audit-logs";

export type AuditLogView = {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  module: string;
  targetType: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
};

const riskValues: AuditLogView["riskLevel"][] = [
  "low",
  "medium",
  "high",
  "critical",
];

// Derive a friendly module label from the action namespace (e.g. "user.created"
// -> "User", "role.permissions_changed" -> "Role").
function moduleFromAction(action: string): string {
  const root = action.split(".")[0] ?? action;
  return root
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Loads the recent audit log feed via the permission-gated list_audit_logs RPC.
// Returns [] on failure so the viewer can render an empty state.
export async function loadAuditLogs(): Promise<AuditLogView[]> {
  try {
    const rows = await listAuditLogs({ limit: 100, actionPrefix: null });
    return rows.map((row) => ({
      id: row.id,
      timestamp: row.created_at,
      actorName: row.actor_name,
      action: row.action,
      module: moduleFromAction(row.action),
      targetType: row.target_type,
      riskLevel: riskValues.includes(row.risk_level as AuditLogView["riskLevel"])
        ? (row.risk_level as AuditLogView["riskLevel"])
        : "low",
      ipAddress: row.ip_address,
      metadata: row.metadata,
    }));
  } catch {
    return [];
  }
}
