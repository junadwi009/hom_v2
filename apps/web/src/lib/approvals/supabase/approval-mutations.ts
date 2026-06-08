import "server-only";

import type { ApprovalRequest } from "@/features/approvals/approval-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { mapRowToApprovalRequest } from "./approval-queries";

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "REQUEST_NOT_FOUND",
  "REQUEST_NOT_ACTIVE",
  "NOTE_REQUIRED",
  "TITLE_REQUIRED",
  "DOMAIN_INVALID",
  "RISK_INVALID",
  "SECOND_APPROVAL_REQUIRED_APPROVE",
  "SECOND_APPROVAL_REQUIRED_REJECT",
  "SECOND_APPROVAL_INVALID_APPROVER",
] as const;

export type ApprovalMutationErrorCode =
  | (typeof knownErrorCodes)[number]
  | "APPROVAL_MUTATION_FAILED";

export class ApprovalMutationError extends Error {
  readonly code: ApprovalMutationErrorCode;
  constructor(code: ApprovalMutationErrorCode) {
    super("Approval mutation failed.");
    this.name = "ApprovalMutationError";
    this.code = code;
  }
  static fromSupabase(error: unknown): ApprovalMutationError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) => message?.includes(candidate));
    return new ApprovalMutationError(code ?? "APPROVAL_MUTATION_FAILED");
  }
}

// The four transition RPCs share the same (p_request_id, p_note) signature;
// escalate additionally accepts an optional new approver.
type TransitionFn =
  | "approve_approval_request"
  | "reject_approval_request"
  | "request_approval_more_info"
  | "escalate_approval_request";

type ApprovalMutationClient = {
  rpc(
    fn: TransitionFn,
    params: {
      p_request_id: string;
      p_note: string | null;
      p_new_approver_id?: string | null;
    },
  ): PromiseLike<{ data: unknown[] | null; error: unknown }>;
};

async function callTransition(
  fn: TransitionFn,
  requestId: string,
  note: string | null,
  newApproverId?: string | null,
): Promise<ApprovalRequest> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as ApprovalMutationClient;
  const params: {
    p_request_id: string;
    p_note: string | null;
    p_new_approver_id?: string | null;
  } = { p_request_id: requestId, p_note: note };
  if (fn === "escalate_approval_request") {
    params.p_new_approver_id = newApproverId ?? null;
  }
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    throw ApprovalMutationError.fromSupabase(error);
  }
  const row = data?.[0];
  if (!row) {
    throw new ApprovalMutationError("APPROVAL_MUTATION_FAILED");
  }
  return mapRowToApprovalRequest(row as Parameters<typeof mapRowToApprovalRequest>[0]);
}

export function approveApprovalRequest(requestId: string, note: string | null) {
  return callTransition("approve_approval_request", requestId, note);
}
export function rejectApprovalRequest(requestId: string, note: string | null) {
  return callTransition("reject_approval_request", requestId, note);
}
export function requestApprovalMoreInfo(requestId: string, note: string | null) {
  return callTransition("request_approval_more_info", requestId, note);
}
export function escalateApprovalRequest(
  requestId: string,
  note: string | null,
  newApproverId?: string | null,
) {
  return callTransition("escalate_approval_request", requestId, note, newApproverId);
}
