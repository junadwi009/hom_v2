"use server";

import { revalidatePath } from "next/cache";

import {
  submitApprovalAction,
  type ApprovalActionInput,
  type ApprovalActionResult,
} from "@/lib/approvals/server/submit-approval-action";

// Single server action used by the Approval Center action modal. Persists the
// transition via the audited RPC, then revalidates the route so a reload shows
// the real, persisted state. (Only async functions are exported from this
// "use server" module; shared types live in submit-approval-action.)
export async function runApprovalAction(
  input: ApprovalActionInput,
): Promise<ApprovalActionResult> {
  const result = await submitApprovalAction(input);
  if (result.status === "success") {
    revalidatePath("/approvals");
  }
  return result;
}
