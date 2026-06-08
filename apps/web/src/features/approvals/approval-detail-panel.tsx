"use client";

import {
  AlertTriangle,
  Check,
  ExternalLink,
  EyeOff,
  FileText,
  Info,
  ShieldAlert,
  Stethoscope,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompactIDR, formatDateID, formatDurationID } from "@/lib/format";

import type { ApprovalActionType } from "./approval-action-modal";
import {
  DOMAIN_LABELS,
  getApprovalStatusBadgeTone,
  getApprovalStatusLabel,
  getRiskBadgeTone,
  getRiskLabel,
  isActiveStatus,
} from "./approval-helpers";
import type { ApprovalRequest } from "./approval-types";

export function ApprovalDetailPanel({
  request,
  canApprove,
  canViewSensitive,
  onAction,
  onViewRelated,
}: {
  request: ApprovalRequest | null;
  canApprove: boolean;
  canViewSensitive: boolean;
  onAction: (action: ApprovalActionType) => void;
  onViewRelated: () => void;
}) {
  if (!request) {
    return (
      <section className="flex h-full min-h-72 flex-col items-center justify-center rounded-lg border bg-background-card p-8 text-center shadow-[var(--shadow-soft)]">
        <FileText aria-hidden="true" className="size-8 text-foreground-muted" />
        <p className="mt-3 text-sm font-medium text-foreground">Pilih request</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Klik salah satu baris untuk melihat detail approval.
        </p>
      </section>
    );
  }

  const active = isActiveStatus(request.status);
  const hidden = !canViewSensitive;
  const isClinicalSensitive = request.domain === "clinical" || request.sensitive;
  const isCritical = request.risk === "critical";

  return (
    <section className="flex max-h-[calc(100vh-7rem)] flex-col rounded-lg border bg-background-card shadow-[var(--shadow-soft)]">
      {/* Fixed header */}
      <header className="border-b px-5 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={getApprovalStatusBadgeTone(request.status)}>
            {getApprovalStatusLabel(request.status)}
          </Badge>
          <Badge tone={getRiskBadgeTone(request.risk)}>{getRiskLabel(request.risk)}</Badge>
          <Badge tone="neutral">{DOMAIN_LABELS[request.domain]}</Badge>
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-foreground">
          {request.title}
        </h2>
        <p className="text-[11px] text-foreground-muted">ID: {request.id.toUpperCase()}</p>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* Clinical / sensitive warning */}
        {isClinicalSensitive && !hidden ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <Stethoscope aria-hidden="true" className="size-4" />
              Permintaan klinis / sensitif
            </p>
            <p className="mt-1 leading-5">
              Berisi data sensitif. Pastikan Anda berwenang (Clinical Lead/Owner) dan
              tindakan tercatat sebelum menyetujui.
            </p>
          </div>
        ) : null}

        {hidden ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <EyeOff aria-hidden="true" className="size-4" />
              Detail klinis disembunyikan
            </p>
            <p className="mt-1">
              Membutuhkan akses Clinical Lead/Owner (`can_view_clinical_cases` /
              `can_approve_note_unlock`).
            </p>
          </div>
        ) : null}

        <div>
          <p className="text-sm font-semibold text-foreground">Informasi</p>
          <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
            <Row label="Diajukan oleh" value={`${request.requestedBy.name} (${request.requestedBy.role})`} />
            <Row label="Diajukan" value={formatDateID(request.requestedAt)} />
            <Row label="Approver" value={`${request.approver.name} (${request.approver.role})`} />
            <Row label="Cabang" value={request.branch} />
            <Row label="Modul terkait" value={request.relatedModule} />
            <Row label="Record" value={request.relatedRecordLabel} />
            <Row label="Menunggu" value={formatDurationID(request.waitingHours)} />
          </dl>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Dampak</p>
          <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
            <Row label="Ringkasan" value={request.impactLabel} />
            {request.amountIdr ? (
              <Row label="Nominal" value={formatCompactIDR(request.amountIdr)} />
            ) : null}
            {request.clientName ? <Row label="Klien" value={request.clientName} /> : null}
            {request.sensitive ? <Row label="Sensitivitas" value="Sensitif" /> : null}
          </dl>
        </div>

        {!hidden ? (
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">Alasan</p>
              <p className="mt-1.5 text-xs leading-5 text-foreground-muted">{request.reason}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Evidence</p>
              <ul className="mt-2 space-y-1.5">
                {request.evidence.map((ev) => (
                  <li
                    className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs"
                    key={ev.id}
                  >
                    <FileText aria-hidden="true" className="size-3.5 text-foreground-muted" />
                    <span className="flex-1 truncate text-foreground">{ev.label}</span>
                    <span className="text-foreground-muted">{ev.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldAlert aria-hidden="true" className="size-4 text-amber-700" />
            Risk Check
          </p>
          <p className="mt-1 leading-5 text-foreground-muted">{request.riskCheck}</p>
          {request.requiresSecondApproval ? (
            <p className="mt-1 font-medium text-amber-800">Membutuhkan persetujuan kedua.</p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Riwayat</p>
          <ul className="mt-2 space-y-2">
            {request.history.map((event) => (
              <li className="flex gap-2 text-xs" key={event.id}>
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-600" />
                <span className="text-foreground-muted">
                  <span className="font-medium text-foreground">{event.action}</span> ·{" "}
                  {event.actorName} · {formatDateID(event.timestamp)}
                  {event.note ? <span className="block italic">“{event.note}”</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full" onClick={onViewRelated} size="sm" type="button" variant="ghost">
          <ExternalLink aria-hidden="true" className="size-4" /> View Related Record
        </Button>
      </div>

      {/* Sticky action bar (always visible) */}
      <footer className="space-y-2 border-t bg-background-card px-4 py-3">
        {!canApprove ? (
          <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] text-foreground-muted">
            Anda tidak memiliki izin menyetujui request jenis ini.
          </p>
        ) : null}
        {isCritical ? (
          <Button
            className="w-full border-amber-300 text-amber-900"
            disabled={!canApprove || !active}
            onClick={() => onAction("escalate")}
            size="sm"
            type="button"
            variant="secondary"
          >
            <AlertTriangle aria-hidden="true" className="size-4" /> Escalate (kritis)
          </Button>
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          <Button
            disabled={!canApprove || !active}
            onClick={() => onAction("reject")}
            size="sm"
            title="Reject"
            type="button"
            variant="secondary"
          >
            <X aria-hidden="true" className="size-4" /> Reject
          </Button>
          <Button
            disabled={!canApprove || !active}
            onClick={() => onAction("need_more_info")}
            size="sm"
            title="Ask More Info"
            type="button"
            variant="secondary"
          >
            <Info aria-hidden="true" className="size-4" /> Info
          </Button>
          <Button
            disabled={!canApprove || !active}
            onClick={() => onAction("approve")}
            size="sm"
            title="Approve"
            type="button"
          >
            <Check aria-hidden="true" className="size-4" /> Approve
          </Button>
        </div>
      </footer>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0">{label}</dt>
      <dd className="break-words text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
