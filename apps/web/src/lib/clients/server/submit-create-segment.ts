import "server-only";

import { z } from "zod";

import type { CreateSegmentActionState } from "@/features/clients/segments/create-segment-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createSegment,
  CreateSegmentRpcError,
  type CreateSegmentErrorCode,
} from "@/lib/clients/supabase/create-segment";

const createSegmentFormSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(300).optional(),
    segmentType: z.enum(["system", "custom"]),
    criteria: z.array(z.string().trim().min(1).max(160)).max(20),
    isActive: z.boolean(),
  })
  .strict();

export async function submitCreateSegmentFormData(
  formData: FormData,
): Promise<CreateSegmentActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan segment tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Masuk dulu untuk menambah segment." };
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk menambah segment." };
  }
  if (!user.permissions.includes("can_manage_clients")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin menambah segment.",
    };
  }

  try {
    const parsed = createSegmentFormSchema.parse({
      name: readFormText(formData, "name"),
      description: readFormText(formData, "description"),
      segmentType: readFormText(formData, "segmentType"),
      criteria: readCriteria(formData, "criteria"),
      isActive: readCheckbox(formData, "isActive"),
    });

    const created = await createSegment({
      name: parsed.name,
      description: parsed.description ? parsed.description : null,
      segmentType: parsed.segmentType,
      criteria: parsed.criteria,
      isActive: parsed.isActive,
    });

    return {
      status: "success",
      segmentId: created.id,
      message: `Segment ${created.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateSegmentActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali data segment yang dimasukkan.",
    };
  }
  if (error instanceof CreateSegmentRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Segment gagal ditambahkan. Coba lagi.",
  };
}

const messageByCode: Record<CreateSegmentErrorCode, CreateSegmentActionState> = {
  AUTH_REQUIRED: { status: "auth_required", message: "Masuk dulu untuk menambah segment." },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin menambah segment.",
  },
  NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama segment wajib diisi.",
  },
  NAME_TOO_LONG: {
    status: "validation_error",
    message: "Nama segment terlalu panjang.",
  },
  TYPE_INVALID: {
    status: "validation_error",
    message: "Tipe segment tidak valid.",
  },
  CREATE_SEGMENT_FAILED: {
    status: "unknown_error",
    message: "Segment gagal ditambahkan. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Criteria comes from a textarea; one criterion per line, empties dropped.
function readCriteria(formData: FormData, key: string): string[] {
  return readFormText(formData, key)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function readCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}
