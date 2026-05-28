import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClass: Record<Tone, string> = {
  success: "text-green-700",
  warning: "text-amber-800",
  danger: "text-red-700",
  info: "text-blue-700",
  neutral: "text-stone-600",
};

export type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  trend?: string;
  tone?: Tone;
};

export function MetricCard({
  label,
  value,
  helper,
  trend = "steady",
  tone = "neutral",
}: MetricCardProps) {
  const Icon = tone === "danger" ? ArrowDownRight : tone === "neutral" ? Minus : ArrowUpRight;

  return (
    <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground-muted">{label}</p>
          <p className="mt-3 whitespace-nowrap text-3xl font-semibold tracking-normal text-foreground">{value}</p>
        </div>
        <Badge tone={tone === "neutral" ? "neutral" : tone}>{trend}</Badge>
      </div>
      <div className={cn("mt-4 flex items-center gap-1 text-sm", toneClass[tone])}>
        <Icon className="size-4" aria-hidden="true" />
        <span>{helper}</span>
      </div>
    </section>
  );
}
