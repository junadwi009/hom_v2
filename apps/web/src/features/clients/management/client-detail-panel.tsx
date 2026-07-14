"use client";

import { useEffect, useRef, useState } from "react";

import { StatusBadge } from "@/components/hom/status-badge";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateID, formatIdr } from "@/lib/format";

import { ClientTabs } from "../shared/clients-tabs";
import type {
  ClientAppointmentRow,
  ClientDetail,
  ClientDetailResult,
  ClientNotes,
  MembershipSummary,
  SpendSummary,
} from "./client-detail-types";
import { loadClientDetailAction } from "./load-client-detail-action";

const TABS = ["Overview", "History", "Notes"];

export type ClientDetailPanelClient = {
  id: string;
  name: string;
  initials: string;
  status: string;
  vip?: boolean;
};

export type ClientDetailPanelState = "loading" | ClientDetailResult;

export function ClientDetailPanel({ client }: { client: ClientDetailPanelClient }) {
  const [state, setState] = useState<ClientDetailPanelState>("loading");
  // Stale-guard: tracks the id of the most recently requested load so a
  // slow earlier response can never overwrite a newer selection's state.
  const activeRequestIdRef = useRef<string | null>(null);
  // Tracks which client id `state` currently reflects. When `client.id`
  // changes we reset to "loading" synchronously during render (the
  // React-endorsed way to adjust state in response to a prop change)
  // instead of inside the effect body, which avoids a setState-in-effect
  // cascade and shows the skeleton immediately rather than one frame late.
  const [loadedForId, setLoadedForId] = useState(client.id);

  if (client.id !== loadedForId) {
    setLoadedForId(client.id);
    setState("loading");
  }

  useEffect(() => {
    const requestedId = client.id;
    activeRequestIdRef.current = requestedId;

    loadClientDetailAction(requestedId).then((result) => {
      if (activeRequestIdRef.current !== requestedId) return;
      setState(result);
    });
  }, [client.id]);

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-sm font-semibold text-amber-900">
          {client.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            {client.name}
            {client.vip ? <Badge tone="warning">VIP</Badge> : null}
          </p>
          <p className="text-xs text-foreground-muted">{client.status} Client</p>
        </div>
      </header>

      <ClientDetailView state={state} />
    </section>
  );
}

// Presentational — no data fetching, no effects. Renders purely off `state`
// so Storybook can exercise every state (loading/ready/error/permission)
// without a live server action. `initialTab` lets stories land directly on
// History/Notes without simulating a click.
export function ClientDetailView({
  state,
  initialTab = 0,
}: {
  state: ClientDetailPanelState;
  initialTab?: number;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex flex-col gap-4">
      <ClientTabs onChange={setActiveTab} tabs={TABS} initialActive={initialTab} />

      {state === "loading" ? (
        <DetailSkeleton />
      ) : state.status === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Gagal memuat detail klien.
        </p>
      ) : state.status === "permission_denied" ? (
        <p className="rounded-md border p-3 text-sm text-foreground-muted">
          Anda tidak memiliki akses ke detail klien ini.
        </p>
      ) : activeTab === 0 ? (
        <OverviewTab detail={state.detail} />
      ) : activeTab === 1 ? (
        <HistoryTab appointments={state.detail.appointments} />
      ) : (
        <NotesTab notes={state.detail.notes} />
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <LoadingSkeleton className="col-span-2 h-24" />
      <LoadingSkeleton className="h-20" />
      <LoadingSkeleton className="h-20" />
    </div>
  );
}

function OverviewTab({ detail }: { detail: ClientDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <MembershipCard membership={detail.membership} />
      <div className="grid grid-cols-2 gap-4">
        <ActivityCard activity={detail.activity} />
        {detail.spend !== null ? <SpendCard spend={detail.spend} /> : null}
      </div>
    </div>
  );
}

function MembershipCard({ membership }: { membership: MembershipSummary | null }) {
  if (!membership) {
    return (
      <div className="rounded-md border p-3">
        <p className="text-sm font-semibold text-foreground">Membership</p>
        <p className="mt-2 text-xs text-foreground-muted">Belum ada membership.</p>
      </div>
    );
  }

  const usedPct =
    membership.totalSessions > 0
      ? Math.round(
          ((membership.totalSessions - membership.remainingSessions) /
            membership.totalSessions) *
            100,
        )
      : 0;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{membership.packageName}</p>
        <Badge tone={membership.active ? "success" : "neutral"}>
          {membership.active ? "Aktif" : "Nonaktif"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-foreground-muted">
        {membership.status} · Exp {formatDateID(membership.expiresAt)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
          <span
            className="block h-full rounded-full bg-accent-gold"
            style={{ width: `${usedPct}%` }}
          />
        </span>
        <span className="shrink-0 text-xs text-foreground-muted">
          {membership.remainingSessions}/{membership.totalSessions} sesi
        </span>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ClientDetail["activity"] }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-semibold text-foreground">Aktivitas</p>
      <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
        <Row
          label="Visit terakhir"
          value={activity.lastVisit ? formatDateID(activity.lastVisit) : "—"}
        />
        <Row label="Total visit" value={String(activity.totalVisits)} />
      </dl>
    </div>
  );
}

function SpendCard({ spend }: { spend: SpendSummary }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-semibold text-foreground">Total Spend</p>
      <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
        <Row label="Total dibayar" value={formatIdr(spend.totalPaidIdr)} />
        <Row
          label="Terakhir bayar"
          value={spend.lastPaymentAt ? formatDateID(spend.lastPaymentAt) : "—"}
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt>{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function HistoryTab({ appointments }: { appointments: ClientAppointmentRow[] }) {
  if (appointments.length === 0) {
    return (
      <p className="rounded-md border p-3 text-sm text-foreground-muted">
        Belum ada kunjungan.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {appointments.map((appointment) => (
        <li
          className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
          key={appointment.id}
        >
          <div className="min-w-0 text-foreground">
            <span className="font-medium">{formatDateID(appointment.startsAt)}</span>
            <span className="text-foreground-muted">
              {" "}
              · {appointment.serviceName} · {appointment.practitionerName}
            </span>
          </div>
          <StatusBadge status={appointment.status} />
        </li>
      ))}
    </ul>
  );
}

function NotesTab({ notes }: { notes: ClientNotes }) {
  if (notes.access === "restricted") {
    return (
      <div className="rounded-md border p-3 text-sm text-foreground-muted">
        Akses terbatas — butuh izin Clinical.
      </div>
    );
  }

  if (notes.cases.length === 0) {
    return (
      <p className="rounded-md border p-3 text-sm text-foreground-muted">
        Belum ada catatan.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.cases.map((clinicalCase) => (
        <li className="rounded-md border p-3" key={clinicalCase.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{clinicalCase.title}</p>
            <div className="flex shrink-0 gap-1.5">
              <Badge tone="neutral">{clinicalCase.caseStatus}</Badge>
              <Badge tone="warning">{clinicalCase.severity}</Badge>
            </div>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            {formatDateID(clinicalCase.openedOn)}
          </p>
          {clinicalCase.summary ? (
            <p className="mt-2 text-xs leading-5 text-foreground-muted">
              {clinicalCase.summary}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
