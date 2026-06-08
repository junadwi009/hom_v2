import "server-only";

import { z } from "zod";

import type { CreateTagActionState } from "@/features/clients/tags/create-tag-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createTag,
  CreateTagRpcError,
  type CreateTagErrorCode,
} from "@/lib/clients/supabase/create-tag";

const createTagFormSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
    description: z.string().trim().max(300).optional(),
    tagType: z.enum(["system", "custom"]),
    isActive: z.boolean(),
  })
  .strict();

export async function submitCreateTagFormData(
  formData: FormData,
): Promise<CreateTagActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan tag tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Masuk dulu untuk menambah tag." };
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk menambah tag." };
  }
  if (!user.permissions.includes("can_manage_clients")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin menambah tag.",
    };
  }

  try {
    const parsed = createTagFormSchema.parse({
      name: readFormText(formData, "name"),
      color: readFormText(formData, "color"),
      description: readFormText(formData, "description"),
      tagType: readFormText(formData, "tagType"),
      isActive: readCheckbox(formData, "isActive"),
    });

    const created = await createTag({
      name: parsed.name,
      color: parsed.color,
      description: parsed.description ? parsed.description : null,
      tagType: parsed.tagType,
      isActive: parsed.isActive,
    });

    return {
      status: "success",
      tagId: created.id,
      message: `Tag ${created.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateTagActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali nama dan warna tag.",
    };
  }
  if (error instanceof CreateTagRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Tag gagal ditambahkan. Coba lagi.",
  };
}

const messageByCode: Record<CreateTagErrorCode, CreateTagActionState> = {
  AUTH_REQUIRED: { status: "auth_required", message: "Masuk dulu untuk menambah tag." },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin menambah tag.",
  },
  NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama tag wajib diisi.",
  },
  NAME_TOO_LONG: {
    status: "validation_error",
    message: "Nama tag terlalu panjang.",
  },
  COLOR_INVALID: {
    status: "validation_error",
    message: "Warna tag harus format hex (#RRGGBB).",
  },
  TYPE_INVALID: {
    status: "validation_error",
    message: "Tipe tag tidak valid.",
  },
  CREATE_TAG_FAILED: {
    status: "unknown_error",
    message: "Tag gagal ditambahkan. Nama tag mungkin sudah dipakai.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}
