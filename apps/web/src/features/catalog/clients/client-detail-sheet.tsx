"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/hom/status-badge";
import { Button } from "@/components/ui/button";

import {
  initialClientDetailState,
  type ClientDetail,
  type ClientDetailAction,
  type ClientDetailState,
} from "./client-detail-types";
import type { ClientTableRow } from "./clients-page-state";

type ClientDetailSheetProps = {
  client: Pick<ClientTableRow, "id" | "name" | "status">;
  action?: ClientDetailAction;
  previewState?: ClientDetailState;
  previewOpen?: boolean;
};

export function ClientDetailSheet({
  client,
  action = previewDetailAction,
  previewState,
  previewOpen = false,
}: ClientDetailSheetProps) {
  const [open, setOpen] = useState(previewOpen);
  const [state, setState] = useState<ClientDetailState>(
    previewState ?? initialClientDetailState,
  );

  const handleOpen = () => {
    setOpen(true);
    if (previewState) {
      setState(previewState);
      return;
    }
    setState({ status: "loading" });
    action(client.id)
      .then(setState)
      .catch(() => setState({ status: "unavailable" }));
  };

  const displayState = previewState ?? state;

  return (
    <>
      <Button
        aria-label={`Detail ${client.name}`}
        onClick={handleOpen}
        size="sm"
        type="button"
        variant="secondary"
      >
        Detail
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close client detail"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby="client-detail-title"
            aria-modal="true"
            className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Profil Klien
                </p>
                <h2
                  className="mt-1 text-xl font-semibold text-foreground"
                  id="client-detail-title"
                >
                  {client.name}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={client.status} />
                </div>
              </div>
              <Button
                aria-label="Close client detail"
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </header>
            <div className="flex-1 px-5 py-5">
              <ClientDetailBody state={displayState} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ClientDetailBody({ state }: { state: ClientDetailState }) {
  if (state.status === "loading" || state.status === "idle") {
    return (
      <p className="text-sm text-foreground-muted" role="status">
        Memuat detail klien…
      </p>
    );
  }

  if (state.status === "not_found") {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Data klien tidak ditemukan.
      </p>
    );
  }

  if (state.status === "unavailable") {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
        Detail klien sementara tidak tersedia. Coba lagi nanti.
      </p>
    );
  }

  return <ClientDetailFields detail={state.detail} />;
}

function ClientDetailFields({ detail }: { detail: ClientDetail }) {
  return (
    <dl className="space-y-4">
      <DetailRow label="Praktisi utama" value={detail.primaryPractitioner} />
      <DetailRow
        label="Telepon"
        value={detail.maskedPhone ?? "—"}
        hint="Nomor ditampilkan tersamarkan demi privasi."
      />
      <DetailRow label="Email" value={detail.maskedEmail ?? "—"} />
      <DetailRow label="Terdaftar sejak" value={detail.created} />
      <DetailRow label="Terakhir diperbarui" value={detail.updated} />
      <DetailRow label="ID klien" value={detail.id} mono />
    </dl>
  );
}

function DetailRow({
  label,
  value,
  hint,
  mono = false,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="border-b pb-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-foreground-muted">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 break-all font-mono text-xs text-foreground"
            : "mt-1 text-sm text-foreground"
        }
      >
        {value}
      </dd>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-foreground-muted">{hint}</p>
      ) : null}
    </div>
  );
}

async function previewDetailAction(): Promise<ClientDetailState> {
  return { status: "unavailable" };
}
