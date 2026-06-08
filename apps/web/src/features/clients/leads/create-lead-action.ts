"use server";

import { revalidatePath } from "next/cache";

import { submitCreateLeadFormData } from "@/lib/clients/server/submit-create-lead";

import type { CreateLeadActionState } from "./create-lead-types";

export async function createLeadAction(
  _previousState: CreateLeadActionState,
  formData: FormData,
): Promise<CreateLeadActionState> {
  const result = await submitCreateLeadFormData(formData);

  if (result.status === "success") {
    revalidatePath("/clients/leads");
  }

  return result;
}
