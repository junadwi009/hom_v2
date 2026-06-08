import type { TrendPoint } from "./overview-data";

const REVENUE_COLOR = "#4f8a5b";
const BOOKING_COLOR = "#7c6bb0";

const WIDTH = 600;
const HEIGHT = 300;
const PAD_L = 36;
const PAD_R = 36;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_W = WIDTH - PAD_L - PAD_R;
const PLOT_H = HEIGHT - PAD_T - PAD_B;

const REVENUE_MAX = 10; // millions of Rp
const BOOKING_MAX = 100;

export function TrendChart({
  series,
  caption,
  stats,
}: {
  series: TrendPoint[];
  caption: string;
  stats: { totalRevenue: string; totalBooking: string; peakLabel: string };
}) {
  const xAt = (index: number) =>
    PAD_L + (PLOT_W * index) / (series.length - 1);
  const yRevenue = (value: number) =>
    PAD_T + PLOT_H - (value / REVENUE_MAX) * PLOT_H;
  const yBooking = (value: number) =>
    PAD_T + PLOT_H - (value / BOOKING_MAX) * PLOT_H;

  const revenueLine = series
    .map((point, index) => `${xAt(index)},${yRevenue(point.revenue)}`)
    .join(" ");
  const bookingLine = series
    .map((point, index) => `${xAt(index)},${yBooking(point.booking)}`)
    .join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(
    (ratio) => PAD_T + PLOT_H * ratio,
  );

  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">
          Trend Revenue &amp; Booking (7 Hari)
        </h2>
        <div className="flex items-center gap-4 text-xs text-foreground-muted">
          <Legend color={REVENUE_COLOR} label="Revenue (Rp)" />
          <Legend color={BOOKING_COLOR} label="Booking" />
        </div>
      </header>

      <svg
        className="h-auto w-full"
        role="img"
        aria-label="Grafik tren revenue dan booking 7 hari terakhir"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        {gridLines.map((y) => (
          <line
            key={y}
            stroke="currentColor"
            className="text-border-subtle"
            strokeWidth={1}
            x1={PAD_L}
            x2={WIDTH - PAD_R}
            y1={y}
            y2={y}
          />
        ))}

        <polyline
          fill="none"
          stroke={REVENUE_COLOR}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          points={revenueLine}
        />
        <polyline
          fill="none"
          stroke={BOOKING_COLOR}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          points={bookingLine}
        />

        {series.map((point, index) => (
          <g key={point.label}>
            <circle
              cx={xAt(index)}
              cy={yRevenue(point.revenue)}
              fill={REVENUE_COLOR}
              r={3}
            />
            <circle
              cx={xAt(index)}
              cy={yBooking(point.booking)}
              fill={BOOKING_COLOR}
              r={3}
            />
            <text
              className="fill-foreground-muted"
              fontSize={11}
              textAnchor="middle"
              x={xAt(index)}
              y={HEIGHT - 8}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-1 items-center gap-4 border-t pt-4 sm:grid-cols-3">
        <dl className="grid grid-cols-3 gap-2 text-center sm:col-span-2">
          <TrendStat label="Total Revenue" value={stats.totalRevenue} />
          <TrendStat label="Total Booking" value={stats.totalBooking} />
          <TrendStat label="Hari Tertinggi" value={stats.peakLabel} />
        </dl>
        <p className="text-[11px] leading-5 text-foreground-muted sm:col-span-1">
          {caption}
        </p>
      </div>
    </section>
  );
}

function TrendStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
