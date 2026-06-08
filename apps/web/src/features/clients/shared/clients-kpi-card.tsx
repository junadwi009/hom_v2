import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ClientKpi = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  trend?: { tone: "up" | "down"; label: string };
  accent?: "default" | "danger" | "warning" | "success" | "info";
};

const accentChip: Record<NonNullable<ClientKpi["accent"]>, string> = {
  default: "bg-accent-gold-muted text-amber-900",
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-800",
  success: "bg-green-100 text-green-700",
  info: "bg-blue-100 text-blue-700",
};

export function ClientKpiCard({
  icon: Icon,
  label,
  value,
  helper,
  trend,
  accent = "default",
}: ClientKpi) {
  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            accentChip[accent],
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <p className="text-xs font-medium leading-4 text-foreground-muted">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {trend ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            trend.tone === "down" ? "text-red-600" : "text-green-700",
          )}
        >
          {trend.tone === "down" ? (
            <ArrowDownRight aria-hidden="true" className="size-3.5" />
          ) : (
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          )}
          {trend.label}
        </p>
      ) : null}
      {helper ? (
        <p className="mt-2 text-[11px] leading-4 text-foreground-muted">{helper}</p>
      ) : null}
    </section>
  );
}

export function ClientKpiRow({
  items,
  className,
}: {
  items: ClientKpi[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      {items.map((kpi) => (
        <ClientKpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
