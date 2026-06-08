"use server";

import { revalidatePath } from "next/cache";

import { submitCreateClinicalCaseFormData } from "@/lib/clinical-cases/server/submit-create-clinical-case";

import type { CreateClinicalCaseActionState } from "./create-clinical-case-types";

export async function createClinicalCaseAction(
  _previousState: CreateClinicalCaseActionState,
  formData: FormData,
): Promise<CreateClinicalCaseActionState> {
  const result = await submitCreateClinicalCaseFormData(formData);

  if (result.status === "success") {
    revalidatePath("/clinical-cases");
  }

  return result;
}
