"use client";

import { Eye, MoreVertical, Send } from "lucide-react";

import { DemoIconButton } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import { TypeBadge } from "../shared/type-badge";
import type { Segment } from "./segments-data";

export function SegmentTable({
  segments,
  selectedId,
  onSelect,
}: {
  segments: Segment[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[940px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Nama Segment</th>
            <th className="border-b px-3 py-2 font-semibold">Tipe</th>
            <th className="border-b px-3 py-2 font-semibold">Jumlah Client</th>
            <th className="border-b px-3 py-2 font-semibold">Kriteria Utama</th>
            <th className="border-b px-3 py-2 font-semibold">Terakhir Diupdate</th>
            <th className="border-b px-3 py-2 font-semibold">Performa (30 Hari)</th>
            <th className="border-b px-3 py-2 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => {
            const Icon = segment.icon;
            return (
              <tr
                className={cn(
                  "cursor-pointer border-b last:border-b-0 hover:bg-stone-50/70",
                  segment.id === selectedId && "bg-accent-gold-muted/40",
                )}
                key={segment.id}
                onClick={() => onSelect(segment.id)}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-gold-muted text-amber-900">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{segment.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {segment.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <TypeBadge type={segment.type} />
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">{segment.clientCount}</p>
                  <p className="text-xs text-foreground-muted">({segment.clientPct})</p>
                </td>
                <td className="px-3 py-3">
                  <ul className="space-y-0.5 text-xs text-foreground-muted">
                    {segment.criteriaShort.map((criteria) => (
                      <li className="flex items-start gap-1.5" key={criteria}>
                        <span className="mt-1 size-1 shrink-0 rounded-full bg-foreground-muted" />
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-3 text-foreground-muted">
                  <p className="text-foreground">{segment.updatedDate}</p>
                  <p className="text-xs">oleh {segment.updatedBy}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-foreground">
                    {segment.perfPrimaryLabel}{" "}
                    <span className="font-semibold text-green-700">
                      {segment.perfPrimaryValue}
                    </span>
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Revenue {segment.perfRevenue}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <DemoIconButton
                      className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                      label="Lihat"
                      message={`Membuka detail segment ${segment.name} (demo).`}
                    >
                      <Eye className="size-4 text-foreground-muted" aria-hidden="true" />
                    </DemoIconButton>
                    <DemoIconButton
                      className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                      label="Kirim campaign"
                      message={`Campaign dikirim ke segment ${segment.name} (demo).`}
                    >
                      <Send className="size-4 text-amber-700" aria-hidden="true" />
                    </DemoIconButton>
                    <DemoIconButton
                      className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                      label="Aksi lain"
                      message={`Menu aksi untuk segment ${segment.name} (demo).`}
                    >
                      <MoreVertical className="size-4 text-foreground-muted" aria-hidden="true" />
                    </DemoIconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

