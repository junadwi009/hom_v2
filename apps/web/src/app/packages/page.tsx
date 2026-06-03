import { PackagesPage } from "@/features/packages/packages/packages-page";
import { loadPackagesPage } from "@/features/packages/packages/packages-page-loader";

export const dynamic = "force-dynamic";

export default async function PackageCatalogRoute() {
  const state = await loadPackagesPage();

  return <PackagesPage state={state} />;
}
