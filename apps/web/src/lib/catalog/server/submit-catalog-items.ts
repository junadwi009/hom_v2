import "server-only";

import { z } from "zod";

import type { CatalogCreateActionState } from "@/features/catalog/service-package/create-product-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  CatalogCreateError,
  createPackage,
  createService,
  type CatalogCreateErrorCode,
} from "./create-catalog-items";

async function ensureContext(): Promise<CatalogCreateActionState | null> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Penyimpanan hanya tersedia di mode Supabase.",
    };
  }
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Masuk dulu untuk menambah item." };
  }
  if (!user) {
    return { status: "auth_required", message: "Masuk dulu untuk menambah item." };
  }
  if (!user.permissions.includes("can_manage_services")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin mengelola katalog.",
    };
  }
  return null;
}

const serviceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(80),
    durationMinutes: z.coerce.number().int().min(1).max(480),
    priceIdr: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
    status: z.enum(["active", "inactive", "archived"]),
  })
  .strict();

export async function submitCreateServiceFormData(
  formData: FormData,
): Promise<CatalogCreateActionState> {
  const blocked = await ensureContext();
  if (blocked) return blocked;

  try {
    const parsed = serviceSchema.parse({
      name: read(formData, "name"),
      category: read(formData, "category"),
      durationMinutes: read(formData, "durationMinutes"),
      priceIdr: read(formData, "priceIdr"),
      status: read(formData, "status"),
    });
    const created = await createService({
      name: parsed.name,
      category: parsed.category,
      durationMinutes: parsed.durationMinutes,
      priceIdr: parsed.priceIdr === "" || parsed.priceIdr === undefined ? null : parsed.priceIdr,
      status: parsed.status,
    });
    return {
      status: "success",
      itemId: created.id,
      message: `Service ${created.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

const packageSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    packageType: z.enum(["intro", "session_pack", "membership"]),
    totalSessions: z.coerce.number().int().min(1).max(1000),
    validityDays: z.coerce.number().int().min(1).max(3650),
    priceIdr: z.coerce.number().int().min(0),
    status: z.enum(["active", "inactive", "archived"]),
  })
  .strict();

export async function submitCreatePackageFormData(
  formData: FormData,
): Promise<CatalogCreateActionState> {
  const blocked = await ensureContext();
  if (blocked) return blocked;

  try {
    const parsed = packageSchema.parse({
      name: read(formData, "name"),
      packageType: read(formData, "packageType"),
      totalSessions: read(formData, "totalSessions"),
      validityDays: read(formData, "validityDays"),
      priceIdr: read(formData, "priceIdr"),
      status: read(formData, "status"),
    });
    const created = await createPackage({
      name: parsed.name,
      packageType: parsed.packageType,
      totalSessions: parsed.totalSessions,
      validityDays: parsed.validityDays,
      priceIdr: parsed.priceIdr,
      status: parsed.status,
    });
    return {
      status: "success",
      itemId: created.id,
      message: `Package ${created.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CatalogCreateActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali data yang dimasukkan.",
    };
  }
  if (error instanceof CatalogCreateError) {
    return { status: stateByCode[error.code], message: messageByCode[error.code] };
  }
  return { status: "unknown_error", message: "Gagal menyimpan. Coba lagi." };
}

const stateByCode: Record<CatalogCreateErrorCode, CatalogCreateActionState["status"]> = {
  AUTH_REQUIRED: "auth_required",
  APP_USER_REQUIRED: "app_user_required",
  PERMISSION_DENIED: "permission_denied",
  NAME_REQUIRED: "validation_error",
  CATEGORY_REQUIRED: "validation_error",
  DURATION_INVALID: "validation_error",
  PRICE_INVALID: "validation_error",
  TYPE_INVALID: "validation_error",
  SESSIONS_INVALID: "validation_error",
  VALIDITY_INVALID: "validation_error",
  STATUS_INVALID: "validation_error",
  CREATE_FAILED: "unknown_error",
};

const messageByCode: Record<CatalogCreateErrorCode, string> = {
  AUTH_REQUIRED: "Masuk dulu untuk menambah item.",
  APP_USER_REQUIRED: "Profil studio Anda belum siap.",
  PERMISSION_DENIED: "Anda tidak memiliki izin mengelola katalog.",
  NAME_REQUIRED: "Nama wajib diisi.",
  CATEGORY_REQUIRED: "Kategori wajib diisi.",
  DURATION_INVALID: "Durasi harus 1–480 menit.",
  PRICE_INVALID: "Harga tidak valid.",
  TYPE_INVALID: "Tipe paket tidak valid.",
  SESSIONS_INVALID: "Jumlah sesi tidak valid.",
  VALIDITY_INVALID: "Masa berlaku tidak valid.",
  STATUS_INVALID: "Status tidak valid.",
  CREATE_FAILED: "Gagal menyimpan. Coba lagi.",
};

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
