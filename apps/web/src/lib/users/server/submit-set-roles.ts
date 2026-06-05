import "server-only";

import { setAdminUserRolesInputSchema } from "@hom/domain/users";

import type { UserAdminActionState } from "@/features/settings/users-action-types";

import { createAdminUserRepository } from "../repository-factory";
import {
  ensureManageUsers,
  mapUserAdminError,
  readFormText,
  readFormTextList,
} from "./user-admin-context";

export async function submitSetUserRolesFormData(
  formData: FormData,
): Promise<UserAdminActionState> {
  const context = await ensureManageUsers();
  if (!context.ok) {
    return context.state;
  }

  try {
    const input = setAdminUserRolesInputSchema.parse({
      id: readFormText(formData, "id"),
      roles: readFormTextList(formData, "roles"),
    });

    const repository = await createAdminUserRepository();
    const user = await repository.setRoles(input.id, input.roles);

    return {
      status: "success",
      userId: user.id,
      message: `Role ${user.email} diperbarui.`,
    };
  } catch (error) {
    return mapUserAdminError(error);
  }
}
