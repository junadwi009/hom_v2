import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateAttendanceRow = {
  id: string;
  practitioner_id: string;
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type CreateAttendanceRpcResponse = {
  data: CreateAttendanceRow[] | null;
  error: unknown;
};

type CreateAttendanceRpcParams = {
  p_practitioner_id: string;
  p_work_date: string;
  p_status: string;
  p_check_in: string | null;
  p_check_out: string | null;
  p_note: string | null;
};

type CreateAttendanceRpcClient = {
  rpc(
    functionName: "create_attendance_record",
    params: CreateAttendanceRpcParams,
  ): PromiseLike<CreateAttendanceRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "PRACTITIONER_REQUIRED",
  "PRACTITIONER_NOT_FOUND",
  "DATE_REQUIRED",
  "STATUS_INVALID",
] as const;

export type CreateAttendanceErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_ATTENDANCE_FAILED";

export class CreateAttendanceRpcError extends Error {
  readonly code: CreateAttendanceErrorCode;

  constructor(code: CreateAttendanceErrorCode) {
    super("Attendance record could not be created.");
    this.name = "CreateAttendanceRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateAttendanceRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateAttendanceRpcError(code ?? "CREATE_ATTENDANCE_FAILED");
  }
}

export type CreateAttendanceInput = {
  practitionerId: string;
  workDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
};

export async function createAttendanceRecord(
  input: CreateAttendanceInput,
): Promise<{ id: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateAttendanceRpcClient;

  const response = await supabase.rpc("create_attendance_record", {
    p_practitioner_id: input.practitionerId,
    p_work_date: input.workDate,
    p_status: input.status,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_note: input.note,
  });

  if (response.error) {
    throw CreateAttendanceRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateAttendanceRpcError("CREATE_ATTENDANCE_FAILED");
  }

  return { id: row.id };
}
