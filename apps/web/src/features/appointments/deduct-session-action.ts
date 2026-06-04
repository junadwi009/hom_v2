"use server";

import { revalidatePath } from "next/cache";

import { submitDeductSessionFormData } from "@/lib/packages/server";

import type { DeductSessionActionState } from "./deduct-session-types";

export async function deductSessionAction(
  _previousState: DeductSessionActionState,
  formData: FormData,
): Promise<DeductSessionActionState> {
  const result = await submitDeductSessionFormData(formData);

  if (result.status === "success") {
    revalidatePath("/appointments");
  }

  return result;
}
