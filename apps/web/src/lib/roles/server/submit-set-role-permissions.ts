import "server-only";

import { z } from "zod";

import type { SetRolePermissionsActionState } from "@/features/settings/roles-permissions/roles-permissions-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  setRolePermissions,
  SetRolePermissionsRpcError,
  type SetRolePermissionsErrorCode,
} from "@/lib/roles/supabase/set-role-permissions";

const schema = z
  .object({
    roleName: z.string().trim().min(1).max(80),
    permissionKeys: z.array(z.string().trim().min(1).max(80)).max(100),
  })
  .strict();

export async function submitSetRolePermissionsFormData(
  formData: FormData,
): Promise<SetRolePermissionsActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pengaturan permission tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk mengubah permission.",
    };
  }
  if (!user) {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk mengubah permission.",
    };
  }
  if (!user.permissions.includes("can_manage_roles_permissions")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin mengelola role & permission.",
    };
  }

  try {
    const parsed = schema.parse({
      roleName: readFormText(formData, "roleName"),
      permissionKeys: formData
        .getAll("permissionKeys")
        .filter((value): value is string => typeof value === "string"),
    });

    const updated = await setRolePermissions({
      roleName: parsed.roleName,
      permissionKeys: parsed.permissionKeys,
    });

    return {
      status: "success",
      roleName: updated.roleName,
      message: `Permission untuk role ${updated.roleName} berhasil disimpan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): SetRolePermissionsActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali role dan permission yang dipilih.",
    };
  }
  if (error instanceof SetRolePermissionsRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Permission gagal disimpan. Coba lagi.",
  };
}

const messageByCode: Record<
  SetRolePermissionsErrorCode,
  SetRolePermissionsActionState
> = {
  AUTH_REQUIRED: {
    status: "auth_required",
    message: "Masuk dulu untuk mengubah permission.",
  },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin mengelola role & permission.",
  },
  ROLE_PROTECTED: {
    status: "role_protected",
    message: "Role super_admin dilindungi dan tidak bisa diubah.",
  },
  ROLE_UNKNOWN: {
    status: "validation_error",
    message: "Role tidak dikenali.",
  },
  PERMISSIONS_REQUIRED: {
    status: "validation_error",
    message: "Daftar permission tidak valid.",
  },
  PERMISSION_UNKNOWN: {
    status: "validation_error",
    message: "Ada permission yang tidak dikenali.",
  },
  SET_ROLE_PERMISSIONS_FAILED: {
    status: "unknown_error",
    message: "Permission gagal disimpan. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
