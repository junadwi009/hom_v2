import {
  Banknote,
  Brain,
  Target,
  TriangleAlert,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { InsightItem } from "./overview-data";

const iconByName: Record<InsightItem["icon"], LucideIcon> = {
  target: Target,
  money: Banknote,
  alert: TriangleAlert,
  brain: Brain,
};

export function InsightStrip({ items }: { items: InsightItem[] }) {
  return (
    <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="mb-4 flex items-center gap-2">
        <Trophy aria-hidden="true" className="size-4 text-amber-700" />
        <h2 className="text-sm font-semibold text-foreground">
          Insight Keputusan Hari Ini
        </h2>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = iconByName[item.icon];
          return (
            <div className="flex gap-3" key={item.title}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-gold-muted text-amber-900">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-foreground-muted">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
