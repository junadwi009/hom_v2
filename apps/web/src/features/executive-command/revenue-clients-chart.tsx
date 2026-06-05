import type { OverviewMonthPoint } from "./overview-loader";
import { formatIdrCompact, formatNumber } from "@/lib/format";

const WIDTH = 760;
const HEIGHT = 300;
const PADDING = { top: 28, right: 24, bottom: 40, left: 24 };

const BAR_COLOR = "var(--accent-gold)";
const LINE_COLOR = "#1f6f5c";

export function RevenueClientsChart({ series }: { series: OverviewMonthPoint[] }) {
  const hasData = series.some(
    (point) => point.revenueIdr > 0 || point.newClients > 0,
  );

  if (series.length === 0 || !hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-stone-50 text-sm text-foreground-muted">
        Belum ada data pendapatan atau klien untuk periode ini.
      </div>
    );
  }

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const baseY = PADDING.top + plotHeight;

  const maxRevenue = Math.max(...series.map((point) => point.revenueIdr), 1);
  const maxClients = Math.max(...series.map((point) => point.newClients), 1);

  const slot = plotWidth / series.length;
  const barWidth = Math.min(slot * 0.5, 56);

  const linePoints = series.map((point, index) => {
    const cx = PADDING.left + slot * index + slot / 2;
    const cy = baseY - (point.newClients / maxClients) * plotHeight;
    return { cx, cy, point };
  });

  const linePath = linePoints
    .map((entry, index) => `${index === 0 ? "M" : "L"} ${entry.cx} ${entry.cy}`)
    .join(" ");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm bg-[var(--accent-gold)]" />
          Pendapatan / bulan
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: LINE_COLOR }} />
          Klien baru / bulan
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-72 w-full"
        role="img"
        aria-label="Grafik pendapatan dan klien baru per bulan"
      >
        <line
          x1={PADDING.left}
          y1={baseY}
          x2={WIDTH - PADDING.right}
          y2={baseY}
          stroke="currentColor"
          className="text-border-subtle"
          strokeWidth="1"
        />
        {series.map((point, index) => {
          const barHeight = (point.revenueIdr / maxRevenue) * plotHeight;
          const x = PADDING.left + slot * index + (slot - barWidth) / 2;
          const y = baseY - barHeight;
          return (
            <g key={point.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, point.revenueIdr > 0 ? 2 : 0)}
                rx="6"
                fill={BAR_COLOR}
              />
              {point.revenueIdr > 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="12"
                  fontWeight="600"
                >
                  {formatIdrCompact(point.revenueIdr)}
                </text>
              ) : null}
              <text
                x={PADDING.left + slot * index + slot / 2}
                y={baseY + 22}
                textAnchor="middle"
                className="fill-foreground-muted"
                fontSize="12"
              >
                {point.label}
              </text>
            </g>
          );
        })}
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth="2.5" />
        {linePoints.map((entry) => (
          <g key={`c-${entry.point.key}`}>
            <circle cx={entry.cx} cy={entry.cy} r="4.5" fill={LINE_COLOR} />
            {entry.point.newClients > 0 ? (
              <text
                x={entry.cx}
                y={entry.cy - 10}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill={LINE_COLOR}
              >
                {formatNumber(entry.point.newClients)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
