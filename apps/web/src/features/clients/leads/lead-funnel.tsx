import { leadFunnelStages } from "./leads-data";

const shades = ["#b199e0", "#c2afe8", "#d3c5ef", "#e2d9f5"];

export function LeadFunnel() {
  const max = leadFunnelStages[0].value;

  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-sm font-semibold text-foreground">Lead Funnel (7 Hari)</h2>
      <ul className="mt-3 flex flex-1 flex-col justify-center gap-2">
        {leadFunnelStages.map((stage, index) => {
          const width = 40 + (stage.value / max) * 60;
          return (
            <li className="flex items-center gap-3" key={stage.label}>
              <div className="flex flex-1 justify-center">
                <div
                  className="rounded-md py-1.5 text-center text-xs font-medium text-stone-700"
                  style={{ width: `${width}%`, backgroundColor: shades[index] }}
                >
                  {stage.label}
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-sm font-semibold text-foreground">
                {stage.value}
                <span className="ml-1 text-xs font-normal text-foreground-muted">
                  {stage.pct}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
