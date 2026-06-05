"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type CatalogTab = "services" | "packages";

export function ServicePackageTabs({
  servicesSlot,
  packagesSlot,
}: {
  servicesSlot: ReactNode;
  packagesSlot: ReactNode;
}) {
  const [tab, setTab] = useState<CatalogTab>("services");

  return (
    <>
      <div
        className="inline-flex w-fit rounded-lg border bg-background-card p-1"
        role="tablist"
        aria-label="Layanan dan paket"
      >
        <TabButton active={tab === "services"} onClick={() => setTab("services")}>
          Layanan
        </TabButton>
        <TabButton active={tab === "packages"} onClick={() => setTab("packages")}>
          Paket
        </TabButton>
      </div>
      {tab === "services" ? servicesSlot : packagesSlot}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground-muted hover:bg-accent-gold-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
