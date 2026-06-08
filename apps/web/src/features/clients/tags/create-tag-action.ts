"use server";

import { revalidatePath } from "next/cache";

import { submitCreateTagFormData } from "@/lib/clients/server/submit-create-tag";

import type { CreateTagActionState } from "./create-tag-types";

export async function createTagAction(
  _previousState: CreateTagActionState,
  formData: FormData,
): Promise<CreateTagActionState> {
  const result = await submitCreateTagFormData(formData);

  if (result.status === "success") {
    revalidatePath("/clients/tags");
  }

  return result;
}
