export type DonutSlice = { label: string; value: number; color: string };

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ClientDonut({
  slices,
  centerTop,
  centerValue,
}: {
  slices: DonutSlice[];
  centerTop: string;
  centerValue: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

  const segments = slices.map((slice, index) => {
    const preceding = slices
      .slice(0, index)
      .reduce((sum, item) => sum + item.value, 0);
    const length = (slice.value / total) * CIRCUMFERENCE;
    return {
      color: slice.color,
      dashArray: `${length} ${CIRCUMFERENCE - length}`,
      dashOffset: -(preceding / total) * CIRCUMFERENCE,
    };
  });

  return (
    <div className="relative shrink-0">
      <svg
        aria-label={centerTop}
        className="size-40 -rotate-90"
        role="img"
        viewBox="0 0 120 120"
      >
        <circle cx={60} cy={60} fill="none" r={RADIUS} stroke="#ececec" strokeWidth={16} />
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
            strokeWidth={16}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-foreground">{centerValue}</span>
        <span className="text-[10px] text-foreground-muted">{centerTop}</span>
      </div>
    </div>
  );
}
