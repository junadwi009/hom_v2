"use client";

import type { ShellUser } from "@hom/domain/auth";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { SidebarNavigation } from "@/features/shell/sidebar-navigation";
import { Topbar } from "@/features/shell/topbar";

export function AppShell({
  children,
  shellUser,
}: {
  children: ReactNode;
  shellUser: ShellUser;
}) {
  return (
    <div className="min-h-screen bg-background-app">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-[var(--background-sidebar)] p-4 text-[var(--sidebar-foreground)] lg:flex">
        <div className="mb-6 rounded-lg border border-white/10 bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--sidebar-muted)]">HOM Studio</p>
          <p className="mt-1 text-xl font-semibold tracking-normal">OS v2</p>
        </div>
        <SidebarNavigation />
        <div className="mt-auto rounded-lg border border-white/10 bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-[var(--accent-gold)] text-sm font-semibold text-stone-950">
              {shellUser.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{shellUser.fullName}</p>
              <p className="text-xs text-[var(--sidebar-muted)]">{shellUser.roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <Topbar />
        <motion.main
          className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6"
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
