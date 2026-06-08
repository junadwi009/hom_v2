"use client";

import type { ShellUser } from "@hom/domain/auth";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { SidebarNavigation } from "@/features/shell/sidebar-navigation";
import { Topbar } from "@/features/shell/topbar";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "hom-sidebar-collapsed";

// Minimal external store so the collapsed preference reads from localStorage without
// setState-in-effect, and stays consistent across hydration.
let sidebarListeners: Array<() => void> = [];

function subscribeSidebar(callback: () => void) {
  sidebarListeners.push(callback);
  return () => {
    sidebarListeners = sidebarListeners.filter((listener) => listener !== callback);
  };
}

function getSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot() {
  return false;
}

function setSidebarCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Ignore persistence failures; the in-memory toggle still notifies listeners.
  }
  sidebarListeners.forEach((listener) => listener());
}

export function AppShell({
  children,
  shellUser,
  showSignOut = false,
}: {
  children: ReactNode;
  shellUser: ShellUser;
  showSignOut?: boolean;
}) {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarCollapsed,
    getSidebarServerSnapshot,
  );

  const toggleCollapsed = () => setSidebarCollapsed(!collapsed);

  return (
    <div className="min-h-screen bg-background-app">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col bg-[var(--background-sidebar)] p-4 text-[var(--sidebar-foreground)] transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <div className="mb-6">
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              aria-expanded={false}
              title="Expand sidebar"
              className="group mx-auto flex size-11 items-center justify-center rounded-md transition-colors hover:bg-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hom-logo.svg"
                alt="HOM Clinical Pilates — The Journey Back to Health"
                className="block w-full max-w-[40px] group-hover:hidden"
              />
              <PanelLeftOpen
                aria-hidden="true"
                className="hidden size-5 text-[var(--sidebar-muted)] group-hover:block group-hover:text-white"
              />
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hom-logo.svg"
                  alt="HOM Clinical Pilates — The Journey Back to Health"
                  className="block max-w-[95px]"
                />
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  aria-expanded={true}
                  title="Collapse sidebar"
                  className="shrink-0 rounded-md p-2 text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white"
                >
                  <PanelLeftClose aria-hidden="true" className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-xs font-medium tracking-normal text-[var(--sidebar-muted)]">
                Dashboard v0.2
              </p>
            </>
          )}
        </div>
        <SidebarNavigation collapsed={collapsed} />
        <div
          className={cn(
            "mt-auto rounded-lg border border-white/10 bg-white/10",
            collapsed ? "p-2" : "p-3",
          )}
        >
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent-gold)] text-sm font-semibold text-stone-950"
              title={collapsed ? `${shellUser.fullName} — ${shellUser.roleLabel}` : undefined}
            >
              {shellUser.initials}
            </div>
            {collapsed ? null : (
              <div>
                <p className="text-sm font-semibold text-white">{shellUser.fullName}</p>
                <p className="text-xs text-[var(--sidebar-muted)]">{shellUser.roleLabel}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className={cn("transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <Topbar showSignOut={showSignOut} />
        <motion.main
          className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[1920px] flex-col gap-6 px-4 py-6 lg:px-6"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
