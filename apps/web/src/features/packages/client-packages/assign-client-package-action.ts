"use server";

import { revalidatePath } from "next/cache";

import { submitAssignClientPackageFormData } from "@/lib/packages/server";

import type { AssignClientPackageActionState } from "./assign-client-package-types";

export async function assignClientPackageAction(
  _previousState: AssignClientPackageActionState,
  formData: FormData,
): Promise<AssignClientPackageActionState> {
  const result = await submitAssignClientPackageFormData(formData);

  if (result.status === "success") {
    revalidatePath("/client-packages");
  }

  return result;
}
