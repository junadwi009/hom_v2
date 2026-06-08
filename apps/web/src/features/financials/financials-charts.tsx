"use client";

import { formatCompactIDR, formatCurrencyIDR } from "@/lib/format";

import type { CategoryTotal, TrendBucket } from "./financials-analytics";

// Grouped vertical bars: income vs expense per time bucket (no chart library).
export function TrendBars({ buckets }: { buckets: TrendBucket[] }) {
  if (buckets.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground-muted">
        Belum ada data untuk grafik tren pada periode ini.
      </p>
    );
  }

  const max = Math.max(
    1,
    ...buckets.map((b) => Math.max(b.income, b.expense)),
  );

  return (
    <div>
      <div className="flex h-44 items-end gap-3">
        {buckets.map((bucket) => (
          <div className="flex flex-1 flex-col items-center gap-1" key={bucket.label}>
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-1/2 max-w-5 rounded-t bg-green-500/80"
                style={{ height: `${(bucket.income / max) * 100}%` }}
                title={`Pemasukan: ${formatCurrencyIDR(bucket.income)}`}
              />
              <div
                className="w-1/2 max-w-5 rounded-t bg-rose-500/80"
                style={{ height: `${(bucket.expense / max) * 100}%` }}
                title={`Pengeluaran: ${formatCurrencyIDR(bucket.expense)}`}
              />
            </div>
            <span className="text-[10px] text-foreground-muted">{bucket.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-green-500/80" /> Pemasukan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-500/80" /> Pengeluaran
        </span>
      </div>
    </div>
  );
}

// Horizontal category bars with amount + share.
export function CategoryBars({
  categories,
  tone,
  emptyLabel,
}: {
  categories: CategoryTotal[];
  tone: "income" | "expense";
  emptyLabel: string;
}) {
  if (categories.length === 0) {
    return <p className="py-6 text-center text-sm text-foreground-muted">{emptyLabel}</p>;
  }

  const barColor = tone === "income" ? "bg-green-500/80" : "bg-rose-500/80";
  const max = Math.max(1, ...categories.map((c) => c.amount));

  return (
    <ul className="space-y-3">
      {categories.slice(0, 6).map((cat) => (
        <li key={cat.category}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">{cat.category}</span>
            <span className="shrink-0 tabular-nums text-foreground-muted">
              {formatCompactIDR(cat.amount)} · {Math.round(cat.share * 100)}%
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${(cat.amount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
