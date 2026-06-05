"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  comingSoonNavigation,
  operationalNavigation,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };

export function SidebarNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        className={cn(
          "flex min-h-10 items-center rounded-md text-sm font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white",
          collapsed ? "justify-center px-0" : "gap-3 px-3",
          isActive &&
            "bg-[var(--accent-gold)] text-stone-950 hover:bg-[var(--accent-gold)] hover:text-stone-950",
        )}
        href={item.href}
        key={item.href}
        title={collapsed ? item.label : undefined}
        aria-label={collapsed ? item.label : undefined}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {collapsed ? null : <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {operationalNavigation.map(renderItem)}

      <div className="pt-3">
        {collapsed ? (
          <div className="mx-2 mb-2 border-t border-white/10" aria-hidden="true" />
        ) : (
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-normal text-[var(--sidebar-muted)] opacity-70">
            Segera hadir
          </p>
        )}
        <div className="space-y-1 opacity-70">
          {comingSoonNavigation.map(renderItem)}
        </div>
      </div>
    </nav>
  );
}
