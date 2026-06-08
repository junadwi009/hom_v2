import {
  CircleAlert,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { DemoButton, DemoLink } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import type { AlertItem } from "./overview-data";

const toneStyles: Record<
  AlertItem["tone"],
  { icon: LucideIcon; chip: string; count: string }
> = {
  danger: { icon: TriangleAlert, chip: "bg-red-100 text-red-700", count: "text-red-700" },
  warning: { icon: CircleAlert, chip: "bg-amber-100 text-amber-800", count: "text-amber-800" },
  info: { icon: Info, chip: "bg-blue-100 text-blue-700", count: "text-blue-700" },
  neutral: { icon: Info, chip: "bg-stone-100 text-stone-700", count: "text-stone-700" },
};

export function AlertPanel({ items }: { items: AlertItem[] }) {
  const totalActions = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Alert &amp; Action Needed
        </h2>
        <DemoLink
          className="text-xs font-medium text-amber-800 hover:underline"
          message="Membuka semua alert & action (demo)."
        >
          Lihat semua
        </DemoLink>
      </header>
      <ul className="flex flex-1 flex-col justify-center divide-y">
        {items.map((item) => {
          const style = toneStyles[item.tone];
          const Icon = style.icon;
          return (
            <li className="flex items-center gap-3 py-3" key={item.title}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md",
                  style.chip,
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {item.subtitle}
                </p>
              </div>
              <span className={cn("text-sm font-semibold", style.count)}>
                {item.count}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-foreground-muted">
          <span className="font-semibold text-foreground">{totalActions}</span>{" "}
          tindakan perlu perhatian
        </span>
        <DemoButton
          message="Membuka antrian tindak lanjut (demo)."
          size="sm"
          type="button"
          variant="secondary"
        >
          Tindak lanjuti
        </DemoButton>
      </div>
    </section>
  );
}
