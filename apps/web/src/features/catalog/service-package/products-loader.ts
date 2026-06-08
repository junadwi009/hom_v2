import "server-only";

import type { Package } from "@hom/domain/packages";
import type { Service } from "@hom/domain/services";

import { createCatalogRepositories } from "@/lib/catalog/repository-factory";
import { createPackageRepositories } from "@/lib/packages/repository-factory";

import type { Product, ProductStatus, ProductType } from "./service-catalog-data";

const statusMap: Record<Service["status"], ProductStatus> = {
  active: "Active",
  inactive: "Draft",
  archived: "Archived",
};

const packageTypeMap: Record<Package["packageType"], ProductType> = {
  membership: "Membership",
  session_pack: "Class Pack",
  intro: "Trial Offer",
};

// Loads real services + packages from Supabase and maps them to the catalog
// Product card shape. Newly created items appear here after revalidation.
export async function loadRealProducts(): Promise<Product[]> {
  const [services, packages] = await Promise.all([
    loadServices(),
    loadPackages(),
  ]);
  return [...services, ...packages];
}

async function loadServices(): Promise<Product[]> {
  try {
    const repositories = await createCatalogRepositories();
    const result = await repositories.services.list({ pageSize: 8 });
    return result.items.map((service) => ({
      id: service.id,
      name: service.name,
      type: "Service" as ProductType,
      price: rupiah(service.defaultPriceIdr),
      unit: `${service.defaultDurationMinutes} menit`,
      description: service.category,
      soldMtd: 0,
      revenue: "Rp 0",
      status: statusMap[service.status],
    }));
  } catch {
    return [];
  }
}

async function loadPackages(): Promise<Product[]> {
  try {
    const repositories = await createPackageRepositories();
    const result = await repositories.packages.list({ pageSize: 8 });
    return result.items.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      type: packageTypeMap[pkg.packageType],
      price: rupiah(pkg.priceIdr),
      unit: `${pkg.validityDays} hari`,
      description: `${pkg.totalSessions}x sesi`,
      soldMtd: 0,
      revenue: "Rp 0",
      status: statusMap[pkg.status],
    }));
  } catch {
    return [];
  }
}

function rupiah(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `Rp ${value.toLocaleString("id-ID")}`;
}
