import type { CatalogListQueryBase } from "./types";

export function applyCatalogPagination<T>(
  items: readonly T[],
  query: CatalogListQueryBase,
) {
  const start = (query.page - 1) * query.pageSize;
  const end = start + query.pageSize;

  return items.slice(start, end);
}

export function includesCatalogSearch(
  values: readonly (string | null | undefined)[],
  search: string,
) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) =>
    value?.toLowerCase().includes(normalizedSearch),
  );
}
