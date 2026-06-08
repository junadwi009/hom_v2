"use server";

import { revalidatePath } from "next/cache";

import { submitCreateAttendanceFormData } from "@/lib/attendance/server/submit-create-attendance-record";

import type { CreateAttendanceActionState } from "./create-attendance-types";

export async function createAttendanceAction(
  _previousState: CreateAttendanceActionState,
  formData: FormData,
): Promise<CreateAttendanceActionState> {
  const result = await submitCreateAttendanceFormData(formData);

  if (result.status === "success") {
    revalidatePath("/team-attendance");
  }

  return result;
}
