import type { FunnelStage } from "./overview-data";

const shades = ["#efeafa", "#e2d9f5", "#d3c5ef", "#c2afe8", "#b199e0"];

export function LeadFunnelCard({
  stages,
  conversionRate,
}: {
  stages: FunnelStage[];
  conversionRate: string;
}) {
  const max = Math.max(...stages.map((stage) => stage.value));

  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-base font-semibold text-foreground">Lead Funnel (30 Hari)</h2>

      <ul className="mt-4 space-y-2">
        {stages.map((stage, index) => {
          const width = 40 + (stage.value / max) * 60; // 40%–100% width
          return (
            <li className="flex items-center gap-3" key={stage.label}>
              <div className="flex flex-1 justify-center">
                <div
                  className="flex items-center justify-center rounded-md py-2 text-xs font-medium text-stone-700"
                  style={{
                    width: `${width}%`,
                    backgroundColor: shades[index] ?? shades[shades.length - 1],
                  }}
                >
                  {stage.label}
                </div>
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-foreground">
                {stage.value}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-md bg-accent-gold-muted px-3 py-2 text-center text-sm font-medium text-amber-900">
        Conversion Rate: {conversionRate}
      </div>
    </section>
  );
}
