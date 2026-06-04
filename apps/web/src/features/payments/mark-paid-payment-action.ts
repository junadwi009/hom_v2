"use server";

import { revalidatePath } from "next/cache";

import { submitMarkPaymentPaidFormData } from "@/lib/payments/server";

import type { PaymentTransitionActionState } from "./payment-transition-types";

export async function markPaidPaymentAction(
  _previousState: PaymentTransitionActionState,
  formData: FormData,
): Promise<PaymentTransitionActionState> {
  const result = await submitMarkPaymentPaidFormData(formData);

  if (result.status === "success") {
    revalidatePath("/payments");
  }

  return result;
}
