"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialCreateSegmentActionState,
  type CreateSegmentActionState,
  type CreateSegmentFormAction,
} from "./create-segment-types";

const TYPE_OPTIONS = [
  { value: "custom", label: "Custom" },
  { value: "system", label: "System" },
];

const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:opacity-60";

export function CreateSegmentSheet({
  action,
  canCreate = true,
}: {
  action: CreateSegmentFormAction;
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const actionWithSuccess = useCallback(
    async (previousState: CreateSegmentActionState, formData: FormData) => {
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
    initialCreateSegmentActionState,
  );

  return (
    <>
      <Button
        disabled={!canCreate}
        onClick={() => setOpen(true)}
        size="sm"
        title={canCreate ? undefined : "Anda tidak memiliki izin menambah segment."}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Tambah Segment
      </Button>

      {state.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {state.message ?? "Segment ditambahkan."}
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Tutup formulir tambah segment"
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
                  Segments
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Tambah Segment Baru
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
                  <span>Nama segment</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    name="name"
                    placeholder="Loyal Members"
                    required
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Deskripsi</span>
                  <input
                    className={inputClass}
                    maxLength={300}
                    name="description"
                    placeholder="Sering datang dan aktif"
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Tipe</span>
                  <select className={inputClass} defaultValue="custom" name="segmentType">
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Kriteria (satu per baris)</span>
                  <textarea
                    className={`${inputClass} h-28 resize-none py-2`}
                    name="criteria"
                    placeholder={"Visit frequency >= 8 / 30 hari\nAttendance rate >= 70%"}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    className="size-4 rounded border"
                    defaultChecked
                    name="isActive"
                    type="checkbox"
                  />
                  <span>Segment aktif</span>
                </label>

                {state.status !== "idle" && state.status !== "success" ? (
                  <p
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
                    role="alert"
                  >
                    {state.message ?? "Segment gagal ditambahkan."}
                  </p>
                ) : null}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                  Batal
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Menyimpan..." : "Simpan Segment"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
