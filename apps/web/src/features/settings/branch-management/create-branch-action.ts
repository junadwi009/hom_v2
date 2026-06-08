"use server";

import { revalidatePath } from "next/cache";

import { submitCreateBranchFormData } from "@/lib/branches/server/submit-create-branch";

import type { CreateBranchActionState } from "./create-branch-types";

export async function createBranchAction(
  _previousState: CreateBranchActionState,
  formData: FormData,
): Promise<CreateBranchActionState> {
  const result = await submitCreateBranchFormData(formData);

  if (result.status === "success") {
    revalidatePath("/settings/branch-management");
  }

  return result;
}
