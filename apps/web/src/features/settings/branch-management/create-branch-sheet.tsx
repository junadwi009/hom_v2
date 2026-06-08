"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialCreateBranchActionState,
  type CreateBranchActionState,
  type CreateBranchFormAction,
} from "./create-branch-types";

const TYPE_OPTIONS = [
  { value: "satellite", label: "Satellite" },
  { value: "main", label: "Main Branch" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:opacity-60";

export function CreateBranchSheet({
  action,
  canCreate = true,
}: {
  action: CreateBranchFormAction;
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const actionWithSuccess = useCallback(
    async (previousState: CreateBranchActionState, formData: FormData) => {
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
    initialCreateBranchActionState,
  );

  return (
    <>
      <Button
        disabled={!canCreate}
        onClick={() => setOpen(true)}
        size="sm"
        title={canCreate ? undefined : "Anda tidak memiliki izin menambah cabang."}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Add Branch
      </Button>

      {state.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {state.message ?? "Cabang ditambahkan."}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Tutup formulir tambah cabang"
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
                  Settings
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Tambah Cabang
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
                  <span>Nama cabang</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    name="name"
                    placeholder="Yoga Shala Kemang"
                    required
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Kota</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    name="city"
                    placeholder="Jakarta Selatan"
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Alamat</span>
                  <input
                    className={inputClass}
                    maxLength={300}
                    name="address"
                    placeholder="Jl. Kemang Raya No. 10"
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Manager</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    name="managerName"
                    placeholder="Nama manager cabang"
                    type="text"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Telepon</span>
                    <input
                      className={inputClass}
                      maxLength={80}
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
                      placeholder="cabang@studio.com"
                      type="email"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Tipe</span>
                    <select className={inputClass} defaultValue="satellite" name="branchType">
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                </div>

                {state.status !== "idle" && state.status !== "success" ? (
                  <p
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
                    role="alert"
                  >
                    {state.message ?? "Cabang gagal ditambahkan."}
                  </p>
                ) : null}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                  Batal
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Menyimpan..." : "Simpan Cabang"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
