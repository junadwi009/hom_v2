// Generic pagination drain helper. Repositories built on the shared catalog
// schema (see packages/domain/src/catalog/schemas.ts) cap `.list()` results
// to `pageSize` (default 20, max 100) via `.range()`. Callers that need the
// FULL result set (e.g. summing all paid payments, counting all completed
// appointments) must page through until every row has been collected —
// otherwise aggregates silently truncate at the first page.
export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Hard safety cap: stop draining after this many pages even if the reported
// `total` never seems to be reached (e.g. inconsistent/racing data), so a
// misbehaving backend can't cause an infinite loop.
const MAX_PAGES = 50;

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPage(page);
    items.push(...result.items);

    const reachedTotal = items.length >= result.total;
    const shortPage = result.items.length < result.pageSize;
    if (reachedTotal || shortPage) break;
  }

  return items;
}
