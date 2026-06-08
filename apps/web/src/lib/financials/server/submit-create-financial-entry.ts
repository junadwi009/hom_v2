import "server-only";

import { z } from "zod";

import type { CreateFinancialEntryActionState } from "@/features/financials/create-financial-entry-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createFinancialEntry,
  CreateFinancialEntryRpcError,
  type CreateFinancialEntryErrorCode,
} from "@/lib/financials/supabase/create-financial-entry";

const createFinancialEntryFormSchema = z
  .object({
    entryType: z.enum(["income", "expense"]),
    category: z.string().trim().min(1).max(120),
    amountIdr: z.coerce.number().int().min(0),
    occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export async function submitCreateFinancialEntryFormData(
  formData: FormData,
): Promise<CreateFinancialEntryActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pencatatan keuangan tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk mencatat transaksi.",
    };
  }
  if (!user) {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk mencatat transaksi.",
    };
  }
  if (!user.permissions.includes("can_edit_financials")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin mencatat transaksi keuangan.",
    };
  }

  try {
    const parsed = createFinancialEntryFormSchema.parse({
      entryType: readFormText(formData, "entryType"),
      category: readFormText(formData, "category"),
      amountIdr: readFormText(formData, "amountIdr"),
      occurredOn: readFormText(formData, "occurredOn"),
      note: readFormText(formData, "note"),
    });

    const created = await createFinancialEntry({
      entryType: parsed.entryType,
      category: parsed.category,
      amountIdr: parsed.amountIdr,
      occurredOn: parsed.occurredOn,
      note: parsed.note ? parsed.note : null,
    });

    return {
      status: "success",
      entryId: created.id,
      message: `Transaksi ${created.category} berhasil dicatat.`,
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateFinancialEntryActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali tipe, kategori, jumlah, dan tanggal.",
    };
  }
  if (error instanceof CreateFinancialEntryRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Transaksi gagal dicatat. Coba lagi.",
  };
}

const messageByCode: Record<
  CreateFinancialEntryErrorCode,
  CreateFinancialEntryActionState
> = {
  AUTH_REQUIRED: {
    status: "auth_required",
    message: "Masuk dulu untuk mencatat transaksi.",
  },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin mencatat transaksi keuangan.",
  },
  TYPE_INVALID: {
    status: "validation_error",
    message: "Tipe transaksi tidak valid.",
  },
  CATEGORY_REQUIRED: {
    status: "validation_error",
    message: "Kategori wajib diisi.",
  },
  CATEGORY_TOO_LONG: {
    status: "validation_error",
    message: "Kategori terlalu panjang.",
  },
  AMOUNT_INVALID: {
    status: "validation_error",
    message: "Jumlah harus angka >= 0.",
  },
  DATE_REQUIRED: {
    status: "validation_error",
    message: "Tanggal wajib diisi.",
  },
  CREATE_FINANCIAL_ENTRY_FAILED: {
    status: "unknown_error",
    message: "Transaksi gagal dicatat. Coba lagi.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
