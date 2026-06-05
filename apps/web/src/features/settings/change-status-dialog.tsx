"use client";

import type { AdminUser, AdminUserStatus } from "@hom/domain/users";
import { useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { ModalShell, UserAdminFeedback } from "./edit-roles-dialog";
import {
  initialUserAdminActionState,
  type UserAdminActionState,
  type UserAdminFormAction,
} from "./users-action-types";

const statusOptions: { value: AdminUserStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "invited", label: "Invited" },
  { value: "suspended", label: "Suspended" },
];

type ChangeStatusDialogProps = {
  user: AdminUser;
  action: UserAdminFormAction;
  onClose: () => void;
};

export function ChangeStatusDialog({
  user,
  action,
  onClose,
}: ChangeStatusDialogProps) {
  const router = useRouter();

  const actionWithSuccess = useCallback(
    async (previousState: UserAdminActionState, formData: FormData) => {
      const result = await action(previousState, formData);
      if (result.status === "success") {
        router.refresh();
        onClose();
      }
      return result;
    },
    [action, router, onClose],
  );

  const [state, formAction, pending] = useActionState(
    actionWithSuccess,
    initialUserAdminActionState,
  );

  return (
    <ModalShell onClose={onClose} subtitle={user.email} title="Ubah Status User">
      <form action={formAction} className="space-y-5">
        <input name="id" type="hidden" value={user.id} />
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Status</span>
          <select
            className={inputClassName}
            defaultValue={user.status}
            name="status"
            required
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <UserAdminFeedback state={state} />
        <div className="flex items-center justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            Batal
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? "Menyimpan..." : "Simpan Status"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";
