"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialCreateClinicalCaseActionState,
  type CreateClinicalCaseActionState,
  type CreateClinicalCaseFormAction,
} from "./create-clinical-case-types";
import type { ClientOption } from "./clinical-cases-loader";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:opacity-60";

export function CreateClinicalCaseSheet({
  action,
  clients,
  canCreate = true,
}: {
  action: CreateClinicalCaseFormAction;
  clients: ClientOption[];
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const actionWithSuccess = useCallback(
    async (previousState: CreateClinicalCaseActionState, formData: FormData) => {
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
    initialCreateClinicalCaseActionState,
  );

  const disabled = !canCreate || clients.length === 0;

  return (
    <>
      <Button
        disabled={disabled}
        onClick={() => setOpen(true)}
        size="sm"
        title={
          canCreate
            ? clients.length === 0
              ? "Tambah client dulu."
              : undefined
            : "Anda tidak memiliki izin mengelola clinical case."
        }
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Buat Case
      </Button>

      {state.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {state.message ?? "Clinical case dibuat."}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Tutup formulir buat clinical case"
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
                  Clinical
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Buat Clinical Case
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Tersimpan ke database studio (audit risk: high).
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
                  <span>Client</span>
                  <select className={inputClass} name="clientId" required>
                    {clients.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Judul</span>
                  <input
                    className={inputClass}
                    maxLength={160}
                    name="title"
                    placeholder="Lower back recovery, prenatal monitoring, ..."
                    required
                    type="text"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Status</span>
                    <select className={inputClass} defaultValue="open" name="caseStatus">
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Severity</span>
                    <select className={inputClass} defaultValue="low" name="severity">
                      {SEVERITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Tanggal dibuka</span>
                  <input className={inputClass} name="openedOn" required type="date" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Ringkasan</span>
                  <textarea
                    className={`${inputClass} h-24 resize-none py-2`}
                    maxLength={1000}
                    name="summary"
                    placeholder="Ringkasan kondisi & rencana penanganan (opsional)."
                  />
                </label>

                {state.status !== "idle" && state.status !== "success" ? (
                  <p
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
                    role="alert"
                  >
                    {state.message ?? "Clinical case gagal dibuat."}
                  </p>
                ) : null}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                  Batal
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Menyimpan..." : "Simpan Case"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
