"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialCreateClientActionState,
  type CreateClientActionState,
  type CreateClientFormAction,
} from "./create-client-types";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:opacity-60";

export function CreateClientSheet({
  action,
  canCreate = true,
}: {
  action: CreateClientFormAction;
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const actionWithSuccess = useCallback(
    async (previousState: CreateClientActionState, formData: FormData) => {
      const result = await action(previousState, formData);
      if (result.status === "success") {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    [action, router],
  );

  const [state, formAction, pending] = useActionState(
    actionWithSuccess,
    initialCreateClientActionState,
  );

  return (
    <>
      <Button
        disabled={!canCreate}
        onClick={() => setOpen(true)}
        size="sm"
        title={canCreate ? undefined : "Anda tidak memiliki izin menambah client."}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Tambah Client
      </Button>

      {state.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {state.message ?? "Client ditambahkan."}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Tutup formulir tambah client"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-modal="true"
            className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Client Management
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Tambah Client Baru
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Tersimpan ke database studio.
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
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Nama lengkap</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    name="fullName"
                    placeholder="Nama client"
                    required
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Nomor telepon</span>
                  <input
                    className={inputClass}
                    name="phone"
                    placeholder="+62 ..."
                    type="tel"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Email</span>
                  <input
                    className={inputClass}
                    name="email"
                    placeholder="nama@email.com"
                    type="email"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Status</span>
                  <select className={inputClass} defaultValue="active" name="status">
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {state.status !== "idle" && state.status !== "success" ? (
                  <p
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
                    role="alert"
                  >
                    {state.message ?? "Client gagal ditambahkan."}
                  </p>
                ) : null}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                  Batal
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Menyimpan..." : "Simpan Client"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
