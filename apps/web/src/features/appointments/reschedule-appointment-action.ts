"use server";

import { revalidatePath } from "next/cache";

import { submitRescheduleAppointmentFormData } from "@/lib/appointments/server/submit-reschedule-appointment";

import type { RescheduleAppointmentActionState } from "./reschedule-appointment-types";

export async function rescheduleAppointmentAction(
  _previousState: RescheduleAppointmentActionState,
  formData: FormData,
): Promise<RescheduleAppointmentActionState> {
  const result = await submitRescheduleAppointmentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/appointments");
  }

  return result;
}
