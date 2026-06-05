"use server";

import { revalidatePath } from "next/cache";

import { submitSetUserStatusFormData } from "@/lib/users/server/submit-set-status";

import type { UserAdminActionState } from "./users-action-types";

export async function setUserStatusAction(
  _previousState: UserAdminActionState,
  formData: FormData,
): Promise<UserAdminActionState> {
  const result = await submitSetUserStatusFormData(formData);

  if (result.status === "success") {
    revalidatePath("/settings");
  }

  return result;
}
