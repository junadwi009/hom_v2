"use server";

import { revalidatePath } from "next/cache";

import { submitSetUserRolesFormData } from "@/lib/users/server/submit-set-roles";

import type { UserAdminActionState } from "./users-action-types";

export async function setUserRolesAction(
  _previousState: UserAdminActionState,
  formData: FormData,
): Promise<UserAdminActionState> {
  const result = await submitSetUserRolesFormData(formData);

  if (result.status === "success") {
    revalidatePath("/settings");
  }

  return result;
}
