"use server";

import { revalidatePath } from "next/cache";

import { submitCancelPaymentFormData } from "@/lib/payments/server";

import type { PaymentTransitionActionState } from "./payment-transition-types";

export async function cancelPaymentAction(
  _previousState: PaymentTransitionActionState,
  formData: FormData,
): Promise<PaymentTransitionActionState> {
  const result = await submitCancelPaymentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/payments");
  }

  return result;
}
