"use server";

import { revalidatePath } from "next/cache";

import {
  submitCreatePackageFormData,
  submitCreateServiceFormData,
} from "@/lib/catalog/server/submit-catalog-items";

import type { CatalogCreateActionState } from "./create-product-types";

export async function createServiceAction(
  _previousState: CatalogCreateActionState,
  formData: FormData,
): Promise<CatalogCreateActionState> {
  const result = await submitCreateServiceFormData(formData);
  if (result.status === "success") {
    revalidatePath("/catalog");
  }
  return result;
}

export async function createPackageAction(
  _previousState: CatalogCreateActionState,
  formData: FormData,
): Promise<CatalogCreateActionState> {
  const result = await submitCreatePackageFormData(formData);
  if (result.status === "success") {
    revalidatePath("/catalog");
  }
  return result;
}
