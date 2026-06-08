import { Info, MessageCircle, MoreVertical } from "lucide-react";

import { DemoButton, DemoIconButton } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import type { DecisionClass, RiskLevel } from "./overview-data";

const riskStyles: Record<RiskLevel, { label: string; chip: string; bar: string }> = {
  tinggi: { label: "Tinggi", chip: "bg-red-50 text-red-700 border-red-200", bar: "bg-red-500" },
  sedang: { label: "Sedang", chip: "bg-amber-50 text-amber-800 border-amber-200", bar: "bg-amber-400" },
  rendah: { label: "Rendah", chip: "bg-green-50 text-green-700 border-green-200", bar: "bg-green-500" },
  penuh: { label: "Penuh", chip: "bg-orange-50 text-orange-700 border-orange-200", bar: "bg-orange-400" },
};

export function DecisionTable({
  rows,
  note,
}: {
  rows: DecisionClass[];
  note: string;
}) {
  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Keputusan Hari Ini: Kelas yang Perlu Perhatian
      </h2>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-2 py-2 font-semibold">Waktu</th>
              <th className="border-b px-2 py-2 font-semibold">Kelas</th>
              <th className="border-b px-2 py-2 font-semibold">Instruktur</th>
              <th className="border-b px-2 py-2 font-semibold">Booked / Capacity</th>
              <th className="border-b px-2 py-2 font-semibold">Occupancy</th>
              <th className="border-b px-2 py-2 font-semibold">Risk</th>
              <th className="border-b px-2 py-2 text-right font-semibold">Rekomendasi Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DecisionRow key={`${row.time}-${row.className}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{note}</span>
      </p>
    </section>
  );
}

function DecisionRow({ row }: { row: DecisionClass }) {
  const style = riskStyles[row.risk];

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-2 py-3 font-medium text-foreground">{row.time}</td>
      <td className="px-2 py-3 text-foreground">{row.className}</td>
      <td className="px-2 py-3">
        <span className="inline-flex items-center gap-2 text-foreground-muted">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent-gold-muted text-[10px] font-semibold text-amber-900">
            {row.instructor.slice(0, 1)}
          </span>
          {row.instructor}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-stone-200">
            <span
              className={cn("block h-full rounded-full", style.bar)}
              style={{ width: `${row.occupancy}%` }}
            />
          </span>
          <span className="whitespace-nowrap text-xs text-foreground-muted">
            {row.booked} / {row.capacity}
          </span>
        </div>
      </td>
      <td className="px-2 py-3 text-foreground">{row.occupancy}%</td>
      <td className="px-2 py-3">
        <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", style.chip)}>
          {style.label}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center justify-end gap-1">
          <DemoButton
            message={`${row.action} — ${row.className} ${row.time} (demo).`}
            size="sm"
            type="button"
            variant="secondary"
          >
            {row.action}
          </DemoButton>
          {row.withWhatsApp ? (
            <DemoIconButton
              className="flex size-8 items-center justify-center rounded-md text-green-600 hover:bg-green-50"
              label="Kirim via WhatsApp"
              message={`Pesan WhatsApp dikirim untuk ${row.className} (demo).`}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
            </DemoIconButton>
          ) : null}
          <DemoIconButton
            className="flex size-8 items-center justify-center rounded-md text-foreground-muted hover:bg-stone-100"
            label="Aksi lain"
            message={`Menu aksi untuk ${row.className} (demo).`}
          >
            <MoreVertical aria-hidden="true" className="size-4" />
          </DemoIconButton>
        </div>
      </td>
    </tr>
  );
}
