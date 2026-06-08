import { Check, Send, Sparkles } from "lucide-react";

import { DemoButton, DemoLink } from "@/features/shell/demo-action";

import { TypeBadge } from "../shared/type-badge";
import type { Segment } from "./segments-data";

export function SegmentDetailPanel({ segment }: { segment: Segment }) {
  const Icon = segment.icon;
  const visibleCriteria = segment.criteriaFull.slice(0, 3);

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent-gold-muted text-amber-900">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-base font-semibold text-foreground">
            {segment.name}
            <TypeBadge type={segment.type} />
          </p>
          <p className="text-xs text-foreground-muted">{segment.description}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 rounded-md border p-3 text-center">
        <Stat label="Jumlah Client" value={String(segment.clientCount)} />
        <Stat label="% dari Total" value={segment.clientPct} />
        <Stat label="Dibuat" value={segment.createdDate} sub={`oleh ${segment.createdBy}`} />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Kriteria Segment</p>
        <ul className="mt-2 space-y-1.5">
          {visibleCriteria.map((criteria) => (
            <li className="flex items-start gap-2 text-xs text-foreground" key={criteria}>
              <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-green-600" />
              {criteria}
            </li>
          ))}
        </ul>
        {segment.criteriaFull.length > 3 ? (
          <DemoLink
            className="mt-2 text-xs font-medium text-amber-800 hover:underline"
            message="Menampilkan semua kriteria segment (demo)."
          >
            Lihat semua kriteria ({segment.criteriaFull.length})
          </DemoLink>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Performa (30 Hari Terakhir)</p>
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-md border p-3 text-center">
          <Stat label={segment.perfPrimaryLabel} value={segment.perfPrimaryValue} />
          <Stat label={segment.perfSecondaryLabel} value={segment.perfSecondaryValue} />
          <Stat label="Revenue" value={segment.perfRevenue} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Meter label="Open Rate" value={segment.openRate} />
          <Meter label="Click Rate" value={segment.clickRate} />
        </div>
      </div>

      <div className="rounded-md border border-accent-gold-muted bg-accent-gold-muted/30 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          AI Insight
        </p>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">{segment.aiInsight}</p>
        <DemoButton
          className="mt-3 w-full"
          message={`Campaign dikirim ke segment ${segment.name} (${segment.clientCount} client) — demo.`}
          size="sm"
          type="button"
        >
          <Send aria-hidden="true" className="size-4" />
          Kirim Campaign ke Segment Ini
        </DemoButton>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[11px] leading-3 text-foreground-muted">{label}</p>
      {sub ? <p className="text-[10px] text-foreground-muted">{sub}</p> : null}
    </div>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground-muted">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <span
          className="block h-full rounded-full bg-accent-gold"
          style={{ width: value }}
        />
      </span>
    </div>
  );
}
