import "server-only";

import { z } from "zod";

import type { CreateClinicalCaseActionState } from "@/features/clinical-cases/create-clinical-case-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createClinicalCase,
  CreateClinicalCaseRpcError,
  type CreateClinicalCaseErrorCode,
} from "@/lib/clinical-cases/supabase/create-clinical-case";

const createClinicalCaseFormSchema = z
  .object({
    clientId: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    caseStatus: z.enum(["open", "monitoring", "resolved"]),
    severity: z.enum(["low", "medium", "high"]),
    summary: z.string().trim().max(1000).optional(),
    openedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export async function submitCreateClinicalCaseFormData(
  formData: FormData,
): Promise<CreateClinicalCaseActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan clinical case tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk membuat clinical case.",
    };
  }
  if (!user) {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk membuat clinical case.",
    };
  }
  if (!user.permissions.includes("can_manage_clinical_cases")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin mengelola clinical case.",
    };
  }

  try {
    const parsed = createClinicalCaseFormSchema.parse({
      clientId: readFormText(formData, "clientId"),
      title: readFormText(formData, "title"),
      caseStatus: readFormText(formData, "caseStatus"),
      severity: readFormText(formData, "severity"),
      summary: readFormText(formData, "summary"),
      openedOn: readFormText(formData, "openedOn"),
    });

    const created = await createClinicalCase({
      clientId: parsed.clientId,
      title: parsed.title,
      caseStatus: parsed.caseStatus,
      severity: parsed.severity,
      summary: parsed.summary ? parsed.summary : null,
      openedOn: parsed.openedOn,
    });

    return {
      status: "success",
      caseId: created.id,
      message: `Clinical case "${created.title}" berhasil dibuat.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateClinicalCaseActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali client, judul, status, dan tanggal.",
    };
  }
  if (error instanceof CreateClinicalCaseRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Clinical case gagal dibuat. Coba lagi.",
  };
}

const messageByCode: Record<
  CreateClinicalCaseErrorCode,
  CreateClinicalCaseActionState
> = {
  AUTH_REQUIRED: {
    status: "auth_required",
    message: "Masuk dulu untuk membuat clinical case.",
  },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin mengelola clinical case.",
  },
  CLIENT_REQUIRED: {
    status: "validation_error",
    message: "Client wajib dipilih.",
  },
  CLIENT_NOT_FOUND: {
    status: "validation_error",
    message: "Client tidak ditemukan.",
  },
  TITLE_REQUIRED: {
    status: "validation_error",
    message: "Judul case wajib diisi.",
  },
  TITLE_TOO_LONG: {
    status: "validation_error",
    message: "Judul case terlalu panjang.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status case tidak valid.",
  },
  SEVERITY_INVALID: {
    status: "validation_error",
    message: "Tingkat keparahan tidak valid.",
  },
  DATE_REQUIRED: {
    status: "validation_error",
    message: "Tanggal wajib diisi.",
  },
  CREATE_CLINICAL_CASE_FAILED: {
    status: "unknown_error",
    message: "Clinical case gagal dibuat. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
