"use server";

import { revalidatePath } from "next/cache";

import { submitCreateUserFormData } from "@/lib/users/server/submit-create-user";

import type { UserAdminActionState } from "./users-action-types";

export async function createUserAction(
  _previousState: UserAdminActionState,
  formData: FormData,
): Promise<UserAdminActionState> {
  const result = await submitCreateUserFormData(formData);

  if (result.status === "success") {
    revalidatePath("/settings");
  }

  return result;
}
