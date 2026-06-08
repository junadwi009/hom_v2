"use client";

import { useState } from "react";

import { DemoLink } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import type { ClassPerformance } from "./overview-data";

type Metric = "occupancy" | "revenue";

function barColor(value: number) {
  if (value >= 70) return "bg-green-500";
  if (value >= 40) return "bg-amber-400";
  return "bg-red-500";
}

export function ClassPerformanceCard({ data }: { data: ClassPerformance[] }) {
  const [metric, setMetric] = useState<Metric>("occupancy");

  const rows = [...data].sort((a, b) => b[metric] - a[metric]);

  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-base font-semibold text-foreground">Kinerja Kelas (30 Hari)</h2>

      <div className="mt-3 inline-flex w-fit rounded-md border bg-background p-0.5 text-xs font-medium">
        <ToggleButton
          active={metric === "occupancy"}
          label="Berdasarkan Occupancy"
          onClick={() => setMetric("occupancy")}
        />
        <ToggleButton
          active={metric === "revenue"}
          label="Berdasarkan Revenue"
          onClick={() => setMetric("revenue")}
        />
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const value = row[metric];
          return (
            <li key={row.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-foreground">{row.name}</span>
                <span className="font-medium text-foreground-muted">{value}%</span>
              </div>
              <span className="block h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <span
                  className={cn("block h-full rounded-full", barColor(value))}
                  style={{ width: `${value}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <DemoLink
        className="mt-4 w-fit text-xs font-medium text-amber-800 hover:underline"
        message="Membuka kinerja semua kelas (demo)."
      >
        Lihat semua kelas →
      </DemoLink>
    </section>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded px-2.5 py-1 transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground-muted hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
