"use server";

import { revalidatePath } from "next/cache";

import { submitCreateSegmentFormData } from "@/lib/clients/server/submit-create-segment";

import type { CreateSegmentActionState } from "./create-segment-types";

export async function createSegmentAction(
  _previousState: CreateSegmentActionState,
  formData: FormData,
): Promise<CreateSegmentActionState> {
  const result = await submitCreateSegmentFormData(formData);

  if (result.status === "success") {
    revalidatePath("/clients/segments");
  }

  return result;
}
