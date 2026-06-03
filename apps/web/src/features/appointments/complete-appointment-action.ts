"use server";

import { revalidatePath } from "next/cache";

import { submitCompleteAppointmentFormData } from "@/lib/appointments/server/submit-complete-appointment";

import type { CompleteAppointmentActionState } from "./complete-appointment-types";

export async function completeAppointmentAction(
  _previousState: CompleteAppointmentActionState,
  formData: FormData,
): Promise<CompleteAppointmentActionState> {
  const result = await submitCompleteAppointmentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/appointments");
  }

  return result;
}
