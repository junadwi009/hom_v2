"use server";

import { revalidatePath } from "next/cache";

import { submitCreateFinancialEntryFormData } from "@/lib/financials/server/submit-create-financial-entry";

import type { CreateFinancialEntryActionState } from "./create-financial-entry-types";

export async function createFinancialEntryAction(
  _previousState: CreateFinancialEntryActionState,
  formData: FormData,
): Promise<CreateFinancialEntryActionState> {
  const result = await submitCreateFinancialEntryFormData(formData);

  if (result.status === "success") {
    revalidatePath("/financials");
  }

  return result;
}
