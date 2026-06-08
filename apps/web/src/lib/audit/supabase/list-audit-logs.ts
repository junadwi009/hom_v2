import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuditLogRow = {
  id: string;
  created_at: string;
  actor_name: string;
  action: string;
  target_type: string;
  risk_level: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
};

type ListAuditLogsRpcResponse = {
  data: AuditLogRow[] | null;
  error: unknown;
};

type ListAuditLogsRpcParams = {
  p_limit: number;
  p_action_prefix: string | null;
};

type ListAuditLogsRpcClient = {
  rpc(
    functionName: "list_audit_logs",
    params: ListAuditLogsRpcParams,
  ): PromiseLike<ListAuditLogsRpcResponse>;
};

export class ListAuditLogsError extends Error {
  constructor() {
    super("Audit logs could not be loaded.");
    this.name = "ListAuditLogsError";
  }
}

export async function listAuditLogs(options: {
  limit?: number;
  actionPrefix?: string | null;
}): Promise<AuditLogRow[]> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as ListAuditLogsRpcClient;

  const response = await supabase.rpc("list_audit_logs", {
    p_limit: options.limit ?? 50,
    p_action_prefix: options.actionPrefix ?? null,
  });

  if (response.error) {
    throw new ListAuditLogsError();
  }

  return response.data ?? [];
}
