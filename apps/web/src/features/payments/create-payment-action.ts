"use server";

import { revalidatePath } from "next/cache";

import { submitCreateManualPaymentFormData } from "@/lib/payments/server";

import type { CreatePaymentActionState } from "./create-payment-types";

export async function createPaymentAction(
  _previousState: CreatePaymentActionState,
  formData: FormData,
): Promise<CreatePaymentActionState> {
  const result = await submitCreateManualPaymentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/payments");
  }

  return result;
}
