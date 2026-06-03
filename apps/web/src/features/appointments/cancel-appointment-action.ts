"use server";

import { revalidatePath } from "next/cache";

import { submitCancelAppointmentFormData } from "@/lib/appointments/server/submit-cancel-appointment";

import type { CancelAppointmentActionState } from "./cancel-appointment-types";

export async function cancelAppointmentAction(
  _previousState: CancelAppointmentActionState,
  formData: FormData,
): Promise<CancelAppointmentActionState> {
  const result = await submitCancelAppointmentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/appointments");
  }

  return result;
}
