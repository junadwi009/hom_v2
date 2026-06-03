"use server";

import { revalidatePath } from "next/cache";

import { submitMarkNoShowAppointmentFormData } from "@/lib/appointments/server/submit-mark-no-show-appointment";

import type { MarkNoShowAppointmentActionState } from "./mark-no-show-appointment-types";

export async function markNoShowAppointmentAction(
  _previousState: MarkNoShowAppointmentActionState,
  formData: FormData,
): Promise<MarkNoShowAppointmentActionState> {
  const result = await submitMarkNoShowAppointmentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/appointments");
  }

  return result;
}
