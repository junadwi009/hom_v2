"use client";

import {
  Archive,
  ChevronDown,
  Crown,
  Dumbbell,
  Gift,
  LayoutGrid,
  Layers,
  List,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { ClientsPageHeader } from "@/features/clients/shared/clients-page-header";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { DemoButton } from "@/features/shell/demo-action";
import { formatIdr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CreatePackageSheet } from "./create-package-sheet";
import { CreateServiceSheet } from "./create-service-sheet";
import type { CatalogCreateFormAction } from "./create-product-types";
import { ProductCard } from "./product-card";
import { ProductTabs, type ProductTab } from "./product-tabs";
import { ServiceFilterPanel } from "./service-filter-panel";
import { products, serviceKpis, type Product } from "./service-catalog-data";

const productTabs: ProductTab[] = [
  { label: "All Products", icon: LayoutGrid },
  { label: "Services", icon: Dumbbell },
  { label: "Membership", icon: Crown },
  { label: "Class Packs", icon: Layers },
  { label: "Trial Offers", icon: Sparkles },
  { label: "Promo & Bundles", icon: Gift },
  { label: "Archived", icon: Archive },
];

const tabFilter: Array<(product: Product) => boolean> = [
  () => true,
  (product) => product.type === "Service",
  (product) => product.type === "Membership",
  (product) => product.type === "Class Pack",
  (product) => product.type === "Trial Offer",
  (product) => product.type === "Bundle",
  (product) => product.status === "Archived",
];

export function ServiceCatalogPage({
  realProducts = [],
  createServiceAction,
  createPackageAction,
  canManage = false,
  revenueMtdIdr = null,
}: {
  realProducts?: Product[];
  createServiceAction: CatalogCreateFormAction;
  createPackageAction: CatalogCreateFormAction;
  canManage?: boolean;
  // Canonical current-month settled-payment revenue (same source as the
  // Executive Overview KPI). null = unavailable (mock mode / query error).
  revenueMtdIdr?: number | null;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState(0);

  // Replace the demo "Revenue (MTD)" figure with the real settled-payment
  // total so this page agrees with Overview instead of showing a fabricated
  // number. Fabricated trend is dropped — we don't have an honest comparison.
  const kpis: ClientKpi[] = serviceKpis.map((kpi) =>
    kpi.label === "Revenue (MTD)"
      ? {
          ...kpi,
          value: revenueMtdIdr === null ? "—" : formatIdr(revenueMtdIdr),
          trend: undefined,
          helper: "pembayaran lunas bulan ini",
        }
      : kpi,
  );

  const catalog = [...realProducts, ...products];

  const visibleProducts = catalog.filter((product) => {
    const matchesTab = tabFilter[activeTab](product);
    const matchesQuery =
      query.trim() === "" ||
      product.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="space-y-4">
      <ClientsPageHeader
        actions={
          <>
            <DemoButton
              message="Import produk: pilih file CSV/XLSX (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Upload aria-hidden="true" className="size-4" />
              Import
            </DemoButton>
            <CreateServiceSheet action={createServiceAction} canManage={canManage} />
            <CreatePackageSheet action={createPackageAction} canManage={canManage} />
          </>
        }
        subtitle="Kelola layanan, paket, dan penawaran untuk studio Anda."
        title="Service & Package"
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
        items={kpis}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-4">
          <ProductTabs
            onChange={setActiveTab}
            tabs={productTabs}
            value={activeTab}
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-2.5 size-4 text-foreground-muted"
              />
              <span className="sr-only">Cari service atau package</span>
              <input
                className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari service atau package..."
                type="search"
                value={query}
              />
            </label>
            <ToolbarSelect ariaLabel="Tipe" options={["Semua Tipe", "Membership", "Class Pack", "Trial Offer", "Service", "Bundle"]} />
            <ToolbarSelect ariaLabel="Status" options={["Semua Status", "Active", "Draft", "Archived"]} />
            <ToolbarSelect ariaLabel="Cabang" options={["Semua Cabang", "HOM Kemang", "HOM Menteng"]} />

            <div className="ml-auto flex items-center gap-2">
              <ToolbarSelect ariaLabel="Urutkan" options={["Terbaru", "Revenue tertinggi", "Paling laku"]} />
              <div className="flex items-center rounded-md border bg-background p-0.5">
                <ViewToggle
                  active={view === "grid"}
                  label="Tampilan grid"
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid aria-hidden="true" className="size-4" />
                </ViewToggle>
                <ViewToggle
                  active={view === "list"}
                  label="Tampilan list"
                  onClick={() => setView("list")}
                >
                  <List aria-hidden="true" className="size-4" />
                </ViewToggle>
              </div>
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background-card py-16 text-center text-sm text-foreground-muted">
              Tidak ada produk yang cocok dengan filter ini.
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                view === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                  : "grid-cols-1",
              )}
            >
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <ServiceFilterPanel />
        </div>
      </div>
    </div>
  );
}

function ToolbarSelect({
  ariaLabel,
  options,
}: {
  ariaLabel: string;
  options: string[];
}) {
  return (
    <span className="relative inline-flex items-center rounded-md border bg-background pl-3 pr-8">
      <select
        aria-label={ariaLabel}
        className="h-9 appearance-none bg-transparent text-sm text-foreground outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 size-4 text-foreground-muted"
      />
    </span>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground-muted hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
