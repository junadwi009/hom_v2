"use server";

import { revalidatePath } from "next/cache";

import { submitSetRolePermissionsFormData } from "@/lib/roles/server/submit-set-role-permissions";

import type { SetRolePermissionsActionState } from "./roles-permissions-types";

export async function setRolePermissionsAction(
  _previousState: SetRolePermissionsActionState,
  formData: FormData,
): Promise<SetRolePermissionsActionState> {
  const result = await submitSetRolePermissionsFormData(formData);

  if (result.status === "success") {
    revalidatePath("/settings/roles-permissions");
  }

  return result;
}
