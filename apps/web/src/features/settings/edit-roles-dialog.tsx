"use client";

import type { AdminUser } from "@hom/domain/users";
import { X } from "lucide-react";
import { useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { roleOptions } from "./role-options";
import {
  initialUserAdminActionState,
  type UserAdminActionState,
  type UserAdminFormAction,
} from "./users-action-types";

type EditRolesDialogProps = {
  user: AdminUser;
  action: UserAdminFormAction;
  onClose: () => void;
};

export function EditRolesDialog({ user, action, onClose }: EditRolesDialogProps) {
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
    <ModalShell
      onClose={onClose}
      subtitle={user.email}
      title="Ubah Role User"
    >
      <form action={formAction} className="space-y-5">
        <input name="id" type="hidden" value={user.id} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Role</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {roleOptions.map((option) => (
              <label
                className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                key={option.value}
              >
                <input
                  className="size-4"
                  defaultChecked={user.roles.includes(option.value)}
                  name="roles"
                  type="checkbox"
                  value={option.value}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <span className="block text-xs font-normal text-foreground-muted">
            Pilih minimal satu role.
          </span>
        </fieldset>
        <UserAdminFeedback state={state} />
        <div className="flex items-center justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            Batal
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? "Menyimpan..." : "Simpan Role"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Tutup dialog"
        className="absolute inset-0 bg-stone-950/35"
        onClick={onClose}
        type="button"
      />
      <section
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-lg border bg-background-card p-5 shadow-2xl"
        role="dialog"
      >
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
            ) : null}
          </div>
          <Button
            aria-label="Tutup"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function UserAdminFeedback({ state }: { state: UserAdminActionState }) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Permintaan gagal diproses. Coba lagi."}
    </p>
  );
}
