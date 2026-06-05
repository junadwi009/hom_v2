import "server-only";

import { z } from "zod";

import type { UserAdminActionState } from "@/features/settings/users-action-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import { AdminUserRpcError, type UserAdminErrorCode } from "../errors";

type EnsureManageUsersResult =
  | { ok: true }
  | { ok: false; state: UserAdminActionState };

// Shared guard for every user-management action: real backend + authenticated
// manager with can_manage_users. The DB RPCs re-check permission too.
export async function ensureManageUsers(): Promise<EnsureManageUsersResult> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      ok: false,
      state: {
        status: "configuration_error",
        message: "Pengelolaan user tidak tersedia di mode mock.",
      },
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return {
      ok: false,
      state: { status: "auth_required", message: "Masuk dulu untuk mengelola user." },
    };
  }

  if (!user) {
    return {
      ok: false,
      state: { status: "auth_required", message: "Masuk dulu untuk mengelola user." },
    };
  }

  if (!user.permissions.includes("can_manage_users")) {
    return {
      ok: false,
      state: {
        status: "permission_denied",
        message: "Anda tidak memiliki izin untuk mengelola user.",
      },
    };
  }

  return { ok: true };
}

export function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function readFormTextList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

const messageByCode: Record<UserAdminErrorCode, UserAdminActionState> = {
  AUTH_REQUIRED: {
    status: "auth_required",
    message: "Masuk dulu untuk mengelola user.",
  },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap untuk mengelola user.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin untuk mengelola user.",
  },
  AUTH_USER_ID_REQUIRED: {
    status: "unknown_error",
    message: "Gagal membuat identitas login. Coba lagi.",
  },
  FULL_NAME_REQUIRED: {
    status: "validation_error",
    message: "Nama lengkap wajib diisi.",
  },
  EMAIL_REQUIRED: {
    status: "validation_error",
    message: "Email wajib diisi.",
  },
  ROLES_REQUIRED: {
    status: "validation_error",
    message: "Pilih minimal satu role.",
  },
  ROLE_UNKNOWN: {
    status: "role_unknown",
    message: "Salah satu role tidak dikenali.",
  },
  EMAIL_ALREADY_EXISTS: {
    status: "email_exists",
    message: "Email tersebut sudah terdaftar.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status user tidak valid.",
  },
  APP_USER_NOT_FOUND: {
    status: "not_found",
    message: "User tidak ditemukan.",
  },
  CANNOT_MODIFY_SELF: {
    status: "cannot_modify_self",
    message: "Anda tidak dapat mengubah akun Anda sendiri.",
  },
  AUTH_CREATE_FAILED: {
    status: "unknown_error",
    message: "Gagal membuat akun login. Coba lagi.",
  },
  USER_ADMIN_FAILED: {
    status: "unknown_error",
    message: "Permintaan gagal diproses. Coba lagi.",
  },
};

export function mapUserAdminError(error: unknown): UserAdminActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali data yang dimasukkan.",
    };
  }

  if (error instanceof AdminUserRpcError) {
    return messageByCode[error.code];
  }

  if (
    error instanceof Error &&
    error.message.includes("service-role environment is missing")
  ) {
    return {
      status: "configuration_error",
      message: "Konfigurasi service-role Supabase belum tersedia.",
    };
  }

  return {
    status: "unknown_error",
    message: "Permintaan gagal diproses. Coba lagi.",
  };
}
