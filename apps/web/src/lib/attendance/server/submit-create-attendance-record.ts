import "server-only";

import { z } from "zod";

import type { CreateAttendanceActionState } from "@/features/team-attendance/create-attendance-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import {
  createAttendanceRecord,
  CreateAttendanceRpcError,
  type CreateAttendanceErrorCode,
} from "@/lib/attendance/supabase/create-attendance-record";

const timePattern = /^\d{2}:\d{2}$/;

const createAttendanceFormSchema = z
  .object({
    practitionerId: z.string().uuid(),
    workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["present", "absent", "late", "leave"]),
    checkIn: z.union([z.literal(""), z.string().regex(timePattern)]).optional(),
    checkOut: z.union([z.literal(""), z.string().regex(timePattern)]).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export async function submitCreateAttendanceFormData(
  formData: FormData,
): Promise<CreateAttendanceActionState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Pencatatan absensi tersimpan hanya tersedia di mode Supabase.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk mencatat absensi.",
    };
  }
  if (!user) {
    return {
      status: "auth_required",
      message: "Masuk dulu untuk mencatat absensi.",
    };
  }
  if (!user.permissions.includes("can_manage_practitioners")) {
    return {
      status: "permission_denied",
      message: "Anda tidak memiliki izin mencatat absensi.",
    };
  }

  try {
    const parsed = createAttendanceFormSchema.parse({
      practitionerId: readFormText(formData, "practitionerId"),
      workDate: readFormText(formData, "workDate"),
      status: readFormText(formData, "status"),
      checkIn: readFormText(formData, "checkIn"),
      checkOut: readFormText(formData, "checkOut"),
      note: readFormText(formData, "note"),
    });

    const created = await createAttendanceRecord({
      practitionerId: parsed.practitionerId,
      workDate: parsed.workDate,
      status: parsed.status,
      checkIn: parsed.checkIn ? parsed.checkIn : null,
      checkOut: parsed.checkOut ? parsed.checkOut : null,
      note: parsed.note ? parsed.note : null,
    });

    return {
      status: "success",
      recordId: created.id,
      message: "Absensi berhasil dicatat.",
    };
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): CreateAttendanceActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Periksa kembali practitioner, tanggal, dan status.",
    };
  }
  if (error instanceof CreateAttendanceRpcError) {
    return messageByCode[error.code];
  }
  return {
    status: "unknown_error",
    message: "Absensi gagal dicatat. Coba lagi.",
  };
}

const messageByCode: Record<
  CreateAttendanceErrorCode,
  CreateAttendanceActionState
> = {
  AUTH_REQUIRED: {
    status: "auth_required",
    message: "Masuk dulu untuk mencatat absensi.",
  },
  APP_USER_REQUIRED: {
    status: "app_user_required",
    message: "Profil studio Anda belum siap.",
  },
  PERMISSION_DENIED: {
    status: "permission_denied",
    message: "Anda tidak memiliki izin mencatat absensi.",
  },
  PRACTITIONER_REQUIRED: {
    status: "validation_error",
    message: "Practitioner wajib dipilih.",
  },
  PRACTITIONER_NOT_FOUND: {
    status: "validation_error",
    message: "Practitioner tidak ditemukan.",
  },
  DATE_REQUIRED: {
    status: "validation_error",
    message: "Tanggal wajib diisi.",
  },
  STATUS_INVALID: {
    status: "validation_error",
    message: "Status absensi tidak valid.",
  },
  CREATE_ATTENDANCE_FAILED: {
    status: "unknown_error",
    message: "Absensi gagal dicatat. Mungkin sudah ada catatan untuk tanggal itu.",
  },
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
