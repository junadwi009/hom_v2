"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialCatalogCreateActionState,
  type CatalogCreateActionState,
  type CatalogCreateFormAction,
} from "./create-product-types";

const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted";

export function CreateServiceSheet({
  action,
  canManage = true,
}: {
  action: CatalogCreateFormAction;
  canManage?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const actionWithSuccess = useCallback(
    async (previousState: CatalogCreateActionState, formData: FormData) => {
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
    initialCatalogCreateActionState,
  );

  return (
    <>
      <Button disabled={!canManage} onClick={() => setOpen(true)} size="sm" type="button">
        <Plus aria-hidden="true" className="size-4" />
        Add Service
      </Button>

      {state.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {state.message ?? "Service ditambahkan."}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Tutup"
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
                  Service & Package
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Tambah Service
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Tersimpan ke database studio.
                </p>
              </div>
              <Button aria-label="Tutup" onClick={() => setOpen(false)} size="icon" type="button" variant="ghost">
                <X aria-hidden="true" className="size-4" />
              </Button>
            </header>

            <form action={formAction} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-5 py-5">
                <Field label="Nama service">
                  <input className={inputClass} maxLength={120} name="name" required type="text" />
                </Field>
                <Field label="Kategori">
                  <input className={inputClass} maxLength={80} name="category" placeholder="mis. Private, Group" required type="text" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Durasi (menit)">
                    <input className={inputClass} max={480} min={1} name="durationMinutes" required type="number" />
                  </Field>
                  <Field label="Harga (Rp)">
                    <input className={inputClass} min={0} name="priceIdr" placeholder="opsional" type="number" />
                  </Field>
                </div>
                <Field label="Status">
                  <select className={inputClass} defaultValue="active" name="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>

                {state.status !== "idle" && state.status !== "success" ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                    {state.message ?? "Gagal menyimpan."}
                  </p>
                ) : null}
              </div>
              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                  Batal
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Menyimpan..." : "Simpan Service"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
