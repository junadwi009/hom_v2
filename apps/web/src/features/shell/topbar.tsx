"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/auth-actions";
import { executiveTabs, getQuickActions } from "@/lib/routes";

export function Topbar({ showSignOut = false }: { showSignOut?: boolean }) {
  const pathname = usePathname();
  // Context-aware quick actions per section (finance pages deep-link their own
  // in-page actions; approvals surfaces Approval Rules; others use defaults).
  const actions = getQuickActions(pathname);

  return (
    <div className="sticky top-0 z-20 border-b bg-background-app/95 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <label className="flex min-h-11 max-w-2xl flex-1 items-center gap-3 rounded-lg border bg-background-card px-3 text-sm text-foreground-muted shadow-[var(--shadow-soft)]">
          <Search className="size-4" aria-hidden="true" />
          <span>Search clients, appointments, approvals</span>
        </label>
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Link
              className="hidden min-h-10 items-center rounded-md border bg-background-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-gold-muted md:inline-flex"
              href={action.href}
              key={action.label}
            >
              {action.label}
            </Link>
          ))}
          <Button type="button" variant="ghost" size="icon" aria-label="Help">
            <CircleHelp className="size-5" aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" aria-hidden="true" />
          </Button>
          {showSignOut ? (
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="size-5" aria-hidden="true" />
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      <nav aria-label="Executive command sections" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {executiveTabs.map((tab) => (
          <Link
            className="min-h-8 shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-accent-gold-muted hover:text-foreground"
            href={tab.href}
            key={tab.label}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
