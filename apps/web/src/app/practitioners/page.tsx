import { PractitionersCatalogPage } from "@/features/catalog/practitioners/practitioners-catalog-page";
import { loadPractitionersCatalogPage } from "@/features/catalog/practitioners/practitioners-page-loader";

export const dynamic = "force-dynamic";

export default async function PractitionersPage() {
  const state = await loadPractitionersCatalogPage();

  return <PractitionersCatalogPage state={state} />;
}
