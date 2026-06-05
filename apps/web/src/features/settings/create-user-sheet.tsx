"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { roleOptions } from "./role-options";
import {
  initialUserAdminActionState,
  type UserAdminActionState,
  type UserAdminFormAction,
} from "./users-action-types";

type CreateUserSheetProps = {
  action?: UserAdminFormAction;
  canManage?: boolean;
  dataMode: "mock" | "supabase";
  initialOpen?: boolean;
  previewState?: UserAdminActionState;
};

export function CreateUserSheet({
  action = blockedPreviewAction,
  canManage = true,
  dataMode,
  initialOpen = false,
  previewState,
}: CreateUserSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);

  const actionWithSuccess = useCallback(
    async (previousState: UserAdminActionState, formData: FormData) => {
      const result = await action(previousState, formData);
      if (result.status === "success") {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    [action, router],
  );

  const [actionState, formAction, pending] = useActionState(
    actionWithSuccess,
    initialUserAdminActionState,
  );
  const displayState = previewState ?? actionState;
  const canSubmit = dataMode === "supabase" && canManage && !pending;

  return (
    <>
      <Button
        disabled={!canManage}
        type="button"
        title={canManage ? undefined : "Anda tidak memiliki izin mengelola user."}
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" className="size-4" />
        Tambah User
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {displayState.message ?? "User berhasil dibuat."}
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Tutup formulir tambah user"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby="create-user-title"
            aria-modal="true"
            className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  User Management
                </p>
                <h2
                  className="mt-1 text-xl font-semibold text-foreground"
                  id="create-user-title"
                >
                  Tambah User Baru
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Membuat akun login baru beserta role-nya.
                </p>
              </div>
              <Button
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </header>
            <form action={formAction} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-5 py-5">
                {dataMode === "mock" ? (
                  <p
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                    role="status"
                  >
                    Mode preview: penyimpanan dinonaktifkan sampai data mode
                    Supabase aktif.
                  </p>
                ) : null}
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Nama lengkap</span>
                  <input
                    className={inputClassName}
                    maxLength={120}
                    name="fullName"
                    placeholder="Nama lengkap user"
                    required
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Email</span>
                  <input
                    autoComplete="off"
                    className={inputClassName}
                    name="email"
                    placeholder="nama@studio.example"
                    required
                    type="email"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Password sementara</span>
                  <input
                    autoComplete="new-password"
                    className={inputClassName}
                    minLength={8}
                    name="password"
                    placeholder="Minimal 8 karakter"
                    required
                    type="password"
                  />
                  <span className="block text-xs font-normal text-foreground-muted">
                    Minimal 8 karakter. Bagikan ke user lewat kanal aman.
                  </span>
                </label>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">
                    Role
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {roleOptions.map((option) => (
                      <label
                        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                        key={option.value}
                      >
                        <input
                          className="size-4"
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
                <UserAdminFeedback state={displayState} />
              </div>
              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Batal
                </Button>
                <Button disabled={!canSubmit} type="submit">
                  {pending ? "Menyimpan..." : "Buat User"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function UserAdminFeedback({ state }: { state: UserAdminActionState }) {
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

async function blockedPreviewAction(): Promise<UserAdminActionState> {
  return {
    status: "configuration_error",
    message: "Penyimpanan tidak tersedia di mode preview.",
  };
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";
