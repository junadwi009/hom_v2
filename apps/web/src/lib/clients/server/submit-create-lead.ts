import "server-only";

import { z } from "zod";

import type { CreateLeadActionState } from "@/features/clients/leads/create-lead-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createLead,
  CreateLeadRpcError,
  type CreateLeadErrorCode,
} from "@/lib/clients/supabase/create-lead";

const createLeadFormSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(80).optional(),
    email: z.union([z.literal(""), z.email().max(180)]).optional(),
    source: z.enum([
      "instagram",
      "whatsapp",
      "google",
      "referral",
      "walk_in",
      "facebook_ads",
    ]),
    stage: z.enum([
      "new_lead",
      "trial_booked",
      "trial_attended",
      "member_converted",
    ]),
    status: z.enum(["hot", "warm", "cold"]),
    score: z.coerce.number().int().min(0).max(100),
    interest: z.string().trim().max(120).optional(),
    branch: z.string().trim().max(120).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export async function submitCreateLeadFormData(
  formData: FormData,
): Promise<CreateLeadActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan lead tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Masuk dulu untuk menambah lead." };
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk menambah lead." };
  }
  if (!user.permissions.includes("can_manage_clients")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin menambah lead.",
    };
  }

  try {
    const parsed = createLeadFormSchema.parse({
      fullName: readFormText(formData, "fullName"),
      phone: readFormText(formData, "phone"),
      email: readFormText(formData, "email"),
      source: readFormText(formData, "source"),
      stage: readFormText(formData, "stage"),
      status: readFormText(formData, "status"),
      score: readFormText(formData, "score"),
      interest: readFormText(formData, "interest"),
      branch: readFormText(formData, "branch"),
      note: readFormText(formData, "note"),
    });

    const created = await createLead({
      fullName: parsed.fullName,
      phone: parsed.phone ? parsed.phone : null,
      email: parsed.email ? parsed.email : null,
      source: parsed.source,
      stage: parsed.stage,
      status: parsed.status,
      score: parsed.score,
      interest: parsed.interest ? parsed.interest : null,
      branch: parsed.branch ? parsed.branch : null,
      note: parsed.note ? parsed.note : null,
    });

    return {
      status: "success",
      leadId: created.id,
      message: `Lead ${created.fullName} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateLeadActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali data lead yang dimasukkan.",
    };
  }
  if (error instanceof CreateLeadRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Lead gagal ditambahkan. Coba lagi.",
  };
}

const messageByCode: Record<CreateLeadErrorCode, CreateLeadActionState> = {
  AUTH_REQUIRED: { status: "auth_required", message: "Masuk dulu untuk menambah lead." },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin menambah lead.",
  },
  FULL_NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama lead wajib diisi.",
  },
  FULL_NAME_TOO_LONG: {
    status: "validation_error",
    message: "Nama lead terlalu panjang.",
  },
  SOURCE_INVALID: {
    status: "validation_error",
    message: "Sumber lead tidak valid.",
  },
  STAGE_INVALID: {
    status: "validation_error",
    message: "Tahap lead tidak valid.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status lead tidak valid.",
  },
  SCORE_INVALID: {
    status: "validation_error",
    message: "Skor lead harus 0–100.",
  },
  CREATE_LEAD_FAILED: {
    status: "unknown_error",
    message: "Lead gagal ditambahkan. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
