import { DemoLink } from "@/features/shell/demo-action";

import type { RevenueSlice } from "./overview-data";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RevenueMixCard({
  slices,
  total,
}: {
  slices: RevenueSlice[];
  total: string;
}) {
  const segments = slices.map((slice, index) => {
    const precedingPercent = slices
      .slice(0, index)
      .reduce((sum, item) => sum + item.percent, 0);
    const length = (slice.percent / 100) * CIRCUMFERENCE;
    return {
      color: slice.color,
      dashArray: `${length} ${CIRCUMFERENCE - length}`,
      dashOffset: -(precedingPercent / 100) * CIRCUMFERENCE,
    };
  });

  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-base font-semibold text-foreground">Revenue Mix (MTD)</h2>

      <div className="mt-4 flex flex-1 items-center gap-6">
        <div className="relative shrink-0">
          <svg
            className="size-40 -rotate-90 sm:size-44"
            role="img"
            aria-label="Komposisi revenue berdasarkan kategori"
            viewBox="0 0 120 120"
          >
            <circle
              cx={60}
              cy={60}
              fill="none"
              r={RADIUS}
              stroke="#ececec"
              strokeWidth={18}
            />
            {segments.map((segment, index) => (
              <circle
                cx={60}
                cy={60}
                fill="none"
                key={index}
                r={RADIUS}
                stroke={segment.color}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                strokeWidth={18}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-foreground-muted">Total</span>
            <span className="text-lg font-semibold text-foreground">
              {total}
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-1.5">
          {slices.map((slice) => (
            <li className="flex items-center gap-2 text-sm" key={slice.label}>
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 text-foreground-muted">{slice.label}</span>
              <span className="font-medium text-foreground">{slice.percent}%</span>
            </li>
          ))}
        </ul>
      </div>

      <DemoLink
        className="mt-4 w-fit text-xs font-medium text-amber-800 hover:underline"
        message="Membuka laporan revenue mix detail (demo)."
      >
        Lihat detail laporan →
      </DemoLink>
    </section>
  );
}
