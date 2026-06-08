"use server";

import { revalidatePath } from "next/cache";

import { submitCreateClientFormData } from "@/lib/clients/server/submit-create-client";

import type { CreateClientActionState } from "./create-client-types";

export async function createClientAction(
  _previousState: CreateClientActionState,
  formData: FormData,
): Promise<CreateClientActionState> {
  const result = await submitCreateClientFormData(formData);

  if (result.status === "success") {
    revalidatePath("/clients");
  }

  return result;
}
