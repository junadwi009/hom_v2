"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { ApprovalRequest } from "./approval-types";

export type ApprovalActionType =
  | "approve"
  | "reject"
  | "need_more_info"
  | "escalate";

const ACTION_META: Record<
  ApprovalActionType,
  { title: string; cta: string; noteLabel: string; placeholder: string; variant: "primary" | "secondary" }
> = {
  approve: {
    title: "Setujui Request",
    cta: "Approve",
    noteLabel: "Catatan persetujuan",
    placeholder: "Tambahkan catatan persetujuan...",
    variant: "primary",
  },
  reject: {
    title: "Tolak Request",
    cta: "Reject",
    noteLabel: "Alasan penolakan",
    placeholder: "Jelaskan alasan penolakan...",
    variant: "secondary",
  },
  need_more_info: {
    title: "Minta Info Tambahan",
    cta: "Kirim Permintaan",
    noteLabel: "Pesan untuk requester",
    placeholder: "Info/dokumen apa yang dibutuhkan...",
    variant: "secondary",
  },
  escalate: {
    title: "Eskalasi Request",
    cta: "Escalate",
    noteLabel: "Catatan eskalasi",
    placeholder: "Alasan eskalasi (opsional)...",
    variant: "secondary",
  },
};

export function ApprovalActionModal({
  action,
  request,
  onConfirm,
  onClose,
}: {
  action: ApprovalActionType;
  request: ApprovalRequest;
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const meta = ACTION_META[action];
  const [note, setNote] = useState("");
  const [escalateTo, setEscalateTo] = useState("Owner");

  // Notes are required for: rejections, info requests, high/critical approvals,
  // and escalation of critical requests.
  const noteRequired =
    action === "reject" ||
    action === "need_more_info" ||
    (action === "approve" && (request.risk === "high" || request.risk === "critical")) ||
    (action === "escalate" && request.risk === "critical");

  const canSubmit = !noteRequired || note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        aria-label="Tutup"
        className="absolute inset-0 bg-stone-950/40"
        onClick={onClose}
        type="button"
      />
      <div
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-lg border bg-background-card shadow-2xl"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{meta.title}</h2>
            <p className="mt-0.5 text-xs text-foreground-muted">{request.title}</p>
          </div>
          <Button aria-label="Tutup" onClick={onClose} size="icon" type="button" variant="ghost">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </header>

        <div className="space-y-3 px-5 py-4">
          {action === "escalate" ? (
            <label className="block space-y-1.5 text-sm font-medium text-foreground">
              <span>Eskalasi ke</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                onChange={(e) => setEscalateTo(e.target.value)}
                value={escalateTo}
              >
                <option value="Owner">Owner</option>
                <option value="Studio Director">Studio Director</option>
                <option value="Clinical Lead">Clinical Lead</option>
                <option value="Finance Admin">Finance Admin</option>
              </select>
            </label>
          ) : null}

          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            <span>
              {meta.noteLabel}
              {noteRequired ? <span className="text-red-600"> *</span> : null}
            </span>
            <textarea
              className="h-24 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
              onChange={(e) => setNote(e.target.value)}
              placeholder={meta.placeholder}
              value={note}
            />
          </label>
          {noteRequired && note.trim().length === 0 ? (
            <p className="text-xs text-red-600">
              {action === "approve"
                ? "Risk tinggi/kritis wajib menyertakan catatan."
                : "Catatan wajib diisi."}
            </p>
          ) : null}
          {request.requiresSecondApproval && action === "approve" ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Request ini membutuhkan persetujuan kedua. (mock — local-state only)
            </p>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t px-5 py-3">
          <Button onClick={onClose} size="sm" type="button" variant="secondary">
            Batal
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onConfirm(
                action === "escalate" && note.trim().length === 0
                  ? `Dieskalasi ke ${escalateTo}.`
                  : note.trim(),
              )
            }
            size="sm"
            type="button"
            variant={meta.variant}
          >
            {meta.cta}
          </Button>
        </footer>
      </div>
    </div>
  );
}
