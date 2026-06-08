function toneColor(ratio: number) {
  if (ratio >= 0.7) return "#4f8a5b";
  if (ratio >= 0.4) return "#d99a2b";
  return "#cf4a3a";
}

const R = 16;
const C = 2 * Math.PI * R;

export function ScoreRing({
  value,
  max = 100,
  px = 56,
  showMax = false,
}: {
  value: number;
  max?: number;
  px?: number;
  showMax?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const color = toneColor(ratio);
  const dash = ratio * C;

  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: px, height: px }}
    >
      <svg className="-rotate-90" height={px} viewBox="0 0 40 40" width={px}>
        <circle cx={20} cy={20} fill="none" r={R} stroke="#ececec" strokeWidth={3.5} />
        <circle
          cx={20}
          cy={20}
          fill="none"
          r={R}
          stroke={color}
          strokeDasharray={`${dash} ${C - dash}`}
          strokeLinecap="round"
          strokeWidth={3.5}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {showMax ? (
          <span className="text-[9px] text-foreground-muted">/{max}</span>
        ) : null}
      </span>
    </span>
  );
}
