import "server-only";

import { z } from "zod";

import type { ApprovalRequest } from "@/features/approvals/approval-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  approveApprovalRequest,
  ApprovalMutationError,
  escalateApprovalRequest,
  rejectApprovalRequest,
  requestApprovalMoreInfo,
} from "@/lib/approvals/supabase/approval-mutations";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

export type ApprovalActionType =
  | "approve"
  | "reject"
  | "need_more_info"
  | "escalate";

export type ApprovalActionResult =
  | { status: "success"; request: ApprovalRequest; message: string }
  | {
      status:
        | "auth_required"
        | "permission_denied"
        | "validation_error"
        | "not_found"
        | "not_active"
        | "note_required"
        | "configuration_error"
        | "unknown_error";
      message: string;
    };

const inputSchema = z.object({
  action: z.enum(["approve", "reject", "need_more_info", "escalate"]),
  requestId: z.string().uuid(),
  note: z.string().trim().max(2000).optional(),
  newApproverId: z.string().uuid().optional(),
});

export type ApprovalActionInput = {
  action: ApprovalActionType;
  requestId: string;
  note?: string;
  newApproverId?: string;
};

export async function submitApprovalAction(
  input: ApprovalActionInput,
): Promise<ApprovalActionResult> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Aksi approval tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk memproses approval." };
  }

  let parsed: z.infer<typeof inputSchema>;
  try {
    parsed = inputSchema.parse(input);
  } catch {
    return { status: "validation_error", message: "Input approval tidak valid." };
  }

  try {
    const note = parsed.note ? parsed.note : null;
    let request: ApprovalRequest;
    switch (parsed.action) {
      case "approve":
        request = await approveApprovalRequest(parsed.requestId, note);
        break;
      case "reject":
        request = await rejectApprovalRequest(parsed.requestId, note);
        break;
      case "need_more_info":
        request = await requestApprovalMoreInfo(parsed.requestId, note);
        break;
      case "escalate":
        request = await escalateApprovalRequest(
          parsed.requestId,
          note,
          parsed.newApproverId ?? null,
        );
        break;
    }
    return {
      status: "success",
      request,
      message: `Request "${request.title}" → ${request.status}.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): ApprovalActionResult {
  if (error instanceof ApprovalMutationError) {
    switch (error.code) {
      case "AUTH_REQUIRED":
        return { status: "auth_required", message: "Sesi berakhir. Masuk lagi." };
      case "APP_USER_REQUIRED":
        return { status: "auth_required", message: "Profil studio Anda belum siap." };
      case "PERMISSION_DENIED":
        return {
          status: "permission_denied",
          message: "Anda tidak berwenang memproses request ini.",
        };
      case "REQUEST_NOT_FOUND":
        return { status: "not_found", message: "Request tidak ditemukan." };
      case "REQUEST_NOT_ACTIVE":
        return {
          status: "not_active",
          message: "Request sudah tidak aktif (sudah diputuskan).",
        };
      case "NOTE_REQUIRED":
        return {
          status: "note_required",
          message: "Catatan wajib untuk aksi ini (risiko tinggi/kritis).",
        };
      default:
        return { status: "unknown_error", message: "Aksi approval gagal. Coba lagi." };
    }
  }
  return { status: "unknown_error", message: "Aksi approval gagal. Coba lagi." };
}
