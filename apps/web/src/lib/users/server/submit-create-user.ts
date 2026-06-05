import "server-only";

import { createAdminUserInputSchema } from "@hom/domain/users";

import type { UserAdminActionState } from "@/features/settings/users-action-types";

import { createAdminUserRepository } from "../repository-factory";
import {
  ensureManageUsers,
  mapUserAdminError,
  readFormText,
  readFormTextList,
} from "./user-admin-context";

export async function submitCreateUserFormData(
  formData: FormData,
): Promise<UserAdminActionState> {
  const context = await ensureManageUsers();
  if (!context.ok) {
    return context.state;
  }

  try {
    const input = createAdminUserInputSchema.parse({
      fullName: readFormText(formData, "fullName"),
      email: readFormText(formData, "email"),
      password: readFormText(formData, "password"),
      roles: readFormTextList(formData, "roles"),
    });

    const repository = await createAdminUserRepository();
    const user = await repository.createUser(input);

    return {
      status: "success",
      userId: user.id,
      message: `User ${user.email} berhasil dibuat.`,
    };
  } catch (error) {
    return mapUserAdminError(error);
  }
}
