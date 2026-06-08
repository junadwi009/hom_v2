"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProductTab = { label: string; icon: LucideIcon };

export function ProductTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: ProductTab[];
  value: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="flex gap-5 overflow-x-auto overflow-y-hidden border-b">
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        return (
          <button
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
              index === value
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground",
            )}
            key={tab.label}
            onClick={() => onChange(index)}
            type="button"
          >
            <Icon aria-hidden="true" className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
