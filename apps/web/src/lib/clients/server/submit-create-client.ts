import "server-only";

import { z } from "zod";

import type { CreateClientActionState } from "@/features/clients/management/create-client-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createClient,
  CreateClientRpcError,
  type CreateClientErrorCode,
} from "@/lib/clients/supabase/create-client";

const createClientFormSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(80).optional(),
    email: z.union([z.literal(""), z.email().max(180)]).optional(),
    status: z.enum(["active", "inactive", "prospect", "archived"]),
  })
  .strict();

export async function submitCreateClientFormData(
  formData: FormData,
): Promise<CreateClientActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan client tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Masuk dulu untuk menambah client." };
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk menambah client." };
  }
  if (!user.permissions.includes("can_manage_clients")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin menambah client.",
    };
  }

  try {
    const parsed = createClientFormSchema.parse({
      fullName: readFormText(formData, "fullName"),
      phone: readFormText(formData, "phone"),
      email: readFormText(formData, "email"),
      status: readFormText(formData, "status"),
    });

    const created = await createClient({
      fullName: parsed.fullName,
      phone: parsed.phone ? parsed.phone : null,
      email: parsed.email ? parsed.email : null,
      status: parsed.status,
    });

    return {
      status: "success",
      clientId: created.id,
      message: `Client ${created.fullName} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateClientActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali nama, email, dan status client.",
    };
  }
  if (error instanceof CreateClientRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Client gagal ditambahkan. Coba lagi.",
  };
}

const messageByCode: Record<CreateClientErrorCode, CreateClientActionState> = {
  AUTH_REQUIRED: { status: "auth_required", message: "Masuk dulu untuk menambah client." },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin menambah client.",
  },
  FULL_NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama client wajib diisi.",
  },
  FULL_NAME_TOO_LONG: {
    status: "validation_error",
    message: "Nama client terlalu panjang.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status client tidak valid.",
  },
  CREATE_CLIENT_FAILED: {
    status: "unknown_error",
    message: "Client gagal ditambahkan. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
