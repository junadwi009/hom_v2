import "server-only";

import { z } from "zod";

import type { CreateBranchActionState } from "@/features/settings/branch-management/create-branch-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createBranch,
  CreateBranchRpcError,
  type CreateBranchErrorCode,
} from "@/lib/branches/supabase/create-branch";

const schema = z
  .object({
    name: z.string().trim().min(1).max(120),
    city: z.string().trim().max(120).optional(),
    address: z.string().trim().max(300).optional(),
    managerName: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(80).optional(),
    email: z.union([z.literal(""), z.email().max(180)]).optional(),
    branchType: z.enum(["main", "satellite"]),
    status: z.enum(["active", "inactive", "archived"]),
  })
  .strict();

export async function submitCreateBranchFormData(
  formData: FormData,
): Promise<CreateBranchActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pembuatan cabang tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Masuk dulu untuk menambah cabang." };
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk menambah cabang." };
  }
  if (!user.permissions.includes("can_manage_users")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin menambah cabang.",
    };
  }

  try {
    const parsed = schema.parse({
      name: readFormText(formData, "name"),
      city: readFormText(formData, "city"),
      address: readFormText(formData, "address"),
      managerName: readFormText(formData, "managerName"),
      phone: readFormText(formData, "phone"),
      email: readFormText(formData, "email"),
      branchType: readFormText(formData, "branchType"),
      status: readFormText(formData, "status"),
    });

    const created = await createBranch({
      name: parsed.name,
      city: parsed.city ? parsed.city : null,
      address: parsed.address ? parsed.address : null,
      managerName: parsed.managerName ? parsed.managerName : null,
      phone: parsed.phone ? parsed.phone : null,
      email: parsed.email ? parsed.email : null,
      branchType: parsed.branchType,
      status: parsed.status,
    });

    return {
      status: "success",
      branchId: created.id,
      message: `Cabang ${created.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateBranchActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali data cabang yang dimasukkan.",
    };
  }
  if (error instanceof CreateBranchRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Cabang gagal ditambahkan. Coba lagi.",
  };
}

const messageByCode: Record<CreateBranchErrorCode, CreateBranchActionState> = {
  AUTH_REQUIRED: { status: "auth_required", message: "Masuk dulu untuk menambah cabang." },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin menambah cabang.",
  },
  NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama cabang wajib diisi.",
  },
  NAME_TOO_LONG: {
    status: "validation_error",
    message: "Nama cabang terlalu panjang.",
  },
  BRANCH_TYPE_INVALID: {
    status: "validation_error",
    message: "Tipe cabang tidak valid.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status cabang tidak valid.",
  },
  CREATE_BRANCH_FAILED: {
    status: "unknown_error",
    message: "Cabang gagal ditambahkan. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
