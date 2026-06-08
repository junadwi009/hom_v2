import {
  CalendarPlus,
  FileText,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DemoButton, DemoLink } from "@/features/shell/demo-action";

import { ClientTabs } from "../shared/clients-tabs";
import { ScoreRing } from "../shared/score-ring";
import type { ManagedClient } from "./management-data";

function healthLabel(score: number) {
  if (score >= 70) return "Sehat";
  if (score >= 40) return "At-Risk";
  return "Berisiko Tinggi";
}

export function ClientDetailPanel({ client }: { client: ManagedClient }) {
  const usedPct = Math.round(
    (client.membership.used / client.membership.total) * 100,
  );

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

      <div className="grid grid-cols-5 gap-1">
        <PanelAction
          icon={MessageCircle}
          label="WhatsApp"
          message={`Membuka chat WhatsApp ke ${client.name} (demo).`}
        />
        <PanelAction
          icon={CalendarPlus}
          label="Book Class"
          message={`Booking kelas untuk ${client.name} (demo).`}
        />
        <PanelAction
          icon={RefreshCw}
          label="Renew"
          message={`Perpanjang membership ${client.name} (demo).`}
        />
        <PanelAction
          icon={FileText}
          label="Add Note"
          message={`Tambah catatan untuk ${client.name} (demo).`}
        />
        <PanelAction
          icon={MoreHorizontal}
          label="More"
          message="Menu aksi lainnya (demo)."
        />
      </div>

      <ClientTabs tabs={["Overview", "History", "Notes", "Communication"]} />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium text-foreground-muted">Health Score</p>
          <div className="mt-2 flex items-center gap-3">
            <ScoreRing px={64} showMax value={client.healthScore} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {healthLabel(client.healthScore)}
              </p>
              <DemoLink
                className="text-xs font-medium text-amber-800 hover:underline"
                message="Membuka rincian Health Score (demo)."
              >
                Lihat detail skor →
              </DemoLink>
            </div>
          </div>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium text-foreground-muted">Alasan Risiko</p>
          <ul className="mt-2 space-y-1.5">
            {client.riskReasons.map((reason) => (
              <li
                className="flex items-start gap-1.5 text-xs leading-4 text-foreground"
                key={reason}
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Membership Aktif</p>
          <Badge tone={client.membership.active ? "success" : "neutral"}>
            {client.membership.active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-foreground">{client.membership.name}</p>
        <p className="text-xs text-foreground-muted">
          {client.membership.startLabel} · {client.membership.expiryLabel}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
            <span
              className="block h-full rounded-full bg-accent-gold"
              style={{ width: `${usedPct}%` }}
            />
          </span>
          <span className="shrink-0 text-xs text-foreground-muted">
            {client.membership.used}/{client.membership.total} {client.membership.unit}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold text-foreground">Aktivitas Terakhir</p>
          <dl className="mt-2 space-y-1 text-foreground-muted">
            <Row label="Visit terakhir" value={client.activity.lastVisit} />
            <Row label="Kelas terakhir" value={client.activity.lastClass} />
            <Row label="Total visit" value={client.activity.totalVisit} />
          </dl>
        </div>
        <div>
          <p className="font-semibold text-foreground">Total Spend</p>
          <dl className="mt-2 space-y-1 text-foreground-muted">
            <Row label="Total" value={client.spend.total} />
            <Row label="Rata-rata / bulan" value={client.spend.perMonth} />
            <Row label="Terakhir bayar" value={client.spend.lastPayment} />
          </dl>
        </div>
      </div>

      <div className="rounded-md border border-accent-gold-muted bg-accent-gold-muted/30 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          AI Recommendation
        </p>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">
          {client.aiRecommendation}
        </p>
        <DemoButton
          className="mt-3 w-full"
          message={`Pesan WhatsApp personal dikirim ke ${client.name} (demo).`}
          size="sm"
          type="button"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Kirim WhatsApp Personal
        </DemoButton>
      </div>
    </section>
  );
}

function PanelAction({
  icon: Icon,
  label,
  message,
}: {
  icon: typeof MessageCircle;
  label: string;
  message: string;
}) {
  return (
    <DemoLink
      className="flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium text-foreground-muted hover:bg-stone-100 hover:text-foreground"
      message={message}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </DemoLink>
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
