"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {primaryNavigation.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white",
              isActive && "bg-[var(--accent-gold)] text-stone-950 hover:bg-[var(--accent-gold)] hover:text-stone-950",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
