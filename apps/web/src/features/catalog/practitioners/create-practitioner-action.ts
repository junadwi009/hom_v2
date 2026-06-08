"use server";

import { revalidatePath } from "next/cache";

import { submitCreatePractitionerFormData } from "@/lib/practitioners/server/submit-create-practitioner";

import type { CreatePractitionerActionState } from "./create-practitioner-types";

export async function createPractitionerAction(
  _previousState: CreatePractitionerActionState,
  formData: FormData,
): Promise<CreatePractitionerActionState> {
  const result = await submitCreatePractitionerFormData(formData);

  if (result.status === "success") {
    revalidatePath("/practitioners");
  }

  return result;
}
