import {
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { DemoLink } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import type { MemberRiskItem } from "./overview-data";

const toneChip: Record<MemberRiskItem["tone"], string> = {
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-stone-100 text-stone-700",
};

const icons: LucideIcon[] = [UserX, UserMinus, UserCheck, UserPlus];

export function MemberRiskCard({ items }: { items: MemberRiskItem[] }) {
  return (
    <section className="flex flex-col rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-base font-semibold text-foreground">Member Risk</h2>
      <ul className="mt-4 flex flex-1 flex-col justify-center gap-4">
        {items.map((item, index) => {
          const Icon = icons[index] ?? UserCheck;
          return (
            <li className="flex items-center gap-3" key={item.title}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md",
                  toneChip[item.tone],
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <p className="min-w-0 flex-1 text-sm text-foreground">{item.title}</p>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {item.count}
              </span>
            </li>
          );
        })}
      </ul>
      <DemoLink
        className="mt-4 w-fit text-xs font-medium text-amber-800 hover:underline"
        message="Membuka daftar lengkap member berisiko (demo)."
      >
        Lihat semua →
      </DemoLink>
    </section>
  );
}
