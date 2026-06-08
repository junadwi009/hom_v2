import "server-only";

import { z } from "zod";

import type { CreatePractitionerActionState } from "@/features/catalog/practitioners/create-practitioner-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createPractitioner,
  CreatePractitionerRpcError,
  type CreatePractitionerErrorCode,
} from "@/lib/practitioners/supabase/create-practitioner";

const createPractitionerFormSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120),
    email: z.union([z.literal(""), z.email().max(180)]).optional(),
    status: z.enum(["active", "inactive", "archived"]),
  })
  .strict();

export async function submitCreatePractitionerFormData(
  formData: FormData,
): Promise<CreatePractitionerActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan practitioner tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk menambah practitioner.",
    };
  }
  if (!user) {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk menambah practitioner.",
    };
  }
  if (!user.permissions.includes("can_manage_practitioners")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin menambah practitioner.",
    };
  }

  try {
    const parsed = createPractitionerFormSchema.parse({
      displayName: readFormText(formData, "displayName"),
      email: readFormText(formData, "email"),
      status: readFormText(formData, "status"),
    });

    const created = await createPractitioner({
      displayName: parsed.displayName,
      email: parsed.email ? parsed.email : null,
      status: parsed.status,
    });

    return {
      status: "success",
      practitionerId: created.id,
      message: `Practitioner ${created.displayName} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreatePractitionerActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali nama, email, dan status practitioner.",
    };
  }
  if (error instanceof CreatePractitionerRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Practitioner gagal ditambahkan. Coba lagi.",
  };
}

const messageByCode: Record<
  CreatePractitionerErrorCode,
  CreatePractitionerActionState
> = {
  AUTH_REQUIRED: {
    status: "auth_required",
    message: "Masuk dulu untuk menambah practitioner.",
  },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin menambah practitioner.",
  },
  NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama practitioner wajib diisi.",
  },
  NAME_TOO_LONG: {
    status: "validation_error",
    message: "Nama practitioner terlalu panjang.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status practitioner tidak valid.",
  },
  CREATE_PRACTITIONER_FAILED: {
    status: "unknown_error",
    message: "Practitioner gagal ditambahkan. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
