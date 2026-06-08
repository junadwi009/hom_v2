"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function ClientTabs({
  tabs,
  onChange,
}: {
  tabs: string[];
  onChange?: (index: number) => void;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex gap-6 overflow-x-auto overflow-y-hidden border-b">
      {tabs.map((tab, index) => (
        <button
          className={cn(
            "relative -mb-px shrink-0 border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
            index === active
              ? "border-foreground text-foreground"
              : "border-transparent text-foreground-muted hover:text-foreground",
          )}
          key={tab}
          onClick={() => {
            setActive(index);
            onChange?.(index);
          }}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
