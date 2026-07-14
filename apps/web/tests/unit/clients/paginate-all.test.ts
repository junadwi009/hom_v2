import { describe, expect, it } from "vitest";

import { fetchAllPages, type PageResult } from "@/features/clients/management/paginate-all";

function makePage<T>(items: T[], total: number, page: number, pageSize: number): PageResult<T> {
  return { items, total, page, pageSize };
}

describe("fetchAllPages", () => {
  it("returns all items in a single page when total <= pageSize", async () => {
    const calls: number[] = [];
    const items = await fetchAllPages<number>(async (page) => {
      calls.push(page);
      return makePage([1, 2, 3], 3, page, 20);
    });

    expect(items).toEqual([1, 2, 3]);
    expect(calls).toEqual([1]);
  });

  it("drains multiple pages and stops once total is reached", async () => {
    const calls: number[] = [];
    const items = await fetchAllPages<number>(async (page) => {
      calls.push(page);
      if (page === 1) return makePage([1, 2], 5, 1, 2);
      if (page === 2) return makePage([3, 4], 5, 2, 2);
      return makePage([5], 5, 3, 2);
    });

    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect(calls).toEqual([1, 2, 3]);
  });

  it("stops on a short page even if total was mis-reported as larger", async () => {
    const items = await fetchAllPages<number>(async (page) => {
      if (page === 1) return makePage([1, 2], 100, 1, 2);
      return makePage([3], 100, 2, 2); // shorter than pageSize -> stop
    });

    expect(items).toEqual([1, 2, 3]);
  });

  it("applies a hard safety cap to avoid an infinite loop on inconsistent data", async () => {
    let calls = 0;
    const items = await fetchAllPages<number>(async (page) => {
      calls += 1;
      // Every page reports a huge total and is always full — would loop
      // forever without the safety cap.
      return makePage([page], Number.MAX_SAFE_INTEGER, page, 1);
    });

    expect(calls).toBe(50);
    expect(items).toHaveLength(50);
  });
});
