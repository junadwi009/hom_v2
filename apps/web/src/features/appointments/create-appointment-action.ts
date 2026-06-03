"use server";

import { revalidatePath } from "next/cache";

import { submitCreateAppointmentFormData } from "@/lib/appointments/server/submit-create-appointment";

import type { CreateAppointmentActionState } from "./create-appointment-types";

export async function createAppointmentAction(
  _previousState: CreateAppointmentActionState,
  formData: FormData,
): Promise<CreateAppointmentActionState> {
  const result = await submitCreateAppointmentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/appointments");
  }

  return result;
}
