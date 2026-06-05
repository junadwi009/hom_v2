import "server-only";

import { setAdminUserStatusInputSchema } from "@hom/domain/users";

import type { UserAdminActionState } from "@/features/settings/users-action-types";

import { createAdminUserRepository } from "../repository-factory";
import {
  ensureManageUsers,
  mapUserAdminError,
  readFormText,
} from "./user-admin-context";

export async function submitSetUserStatusFormData(
  formData: FormData,
): Promise<UserAdminActionState> {
  const context = await ensureManageUsers();
  if (!context.ok) {
    return context.state;
  }

  try {
    const input = setAdminUserStatusInputSchema.parse({
      id: readFormText(formData, "id"),
      status: readFormText(formData, "status"),
    });

    const repository = await createAdminUserRepository();
    const user = await repository.setStatus(input.id, input.status);

    return {
      status: "success",
      userId: user.id,
      message: `Status ${user.email} diubah menjadi ${user.status}.`,
    };
  } catch (error) {
    return mapUserAdminError(error);
  }
}
