import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Hourglass,
  TrendingUp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

import { DemoLink } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import type { KpiCard } from "./overview-data";

const iconByKey: Record<string, LucideIcon> = {
  revenue: CircleDollarSign,
  booking: CalendarDays,
  occupancy: TrendingUp,
  members: Users,
  expiring: Hourglass,
  action: TriangleAlert,
};

export function KpiCards({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <KpiCardItem card={card} key={card.key} />
      ))}
    </div>
  );
}

function KpiCardItem({ card }: { card: KpiCard }) {
  const Icon = iconByKey[card.key] ?? CircleDollarSign;
  const danger = card.variant === "danger";

  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)]",
        danger && "border-red-200 bg-red-50/60",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            danger ? "bg-red-100 text-red-700" : "bg-accent-gold-muted text-amber-900",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <p
          className={cn(
            "text-xs font-medium leading-4",
            danger ? "text-red-700" : "text-foreground-muted",
          )}
        >
          {card.label}
        </p>
      </div>

      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight text-foreground",
          danger && "text-red-700",
        )}
      >
        {card.value}
      </p>

      {card.trend ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            card.trend.tone === "down" ? "text-red-600" : "text-green-700",
          )}
        >
          {card.trend.tone === "down" ? (
            <ArrowDownRight aria-hidden="true" className="size-3.5" />
          ) : (
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          )}
          {card.trend.label}
        </p>
      ) : null}

      {card.helper ? (
        <p className="mt-2 text-[11px] leading-4 text-foreground-muted">
          {card.helper}
        </p>
      ) : null}

      {card.cta ? (
        <DemoLink
          className="mt-2 inline-flex w-fit items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
          message="Membuka daftar prioritas tindakan (demo)."
        >
          {card.cta} →
        </DemoLink>
      ) : null}
    </section>
  );
}
