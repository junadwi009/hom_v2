import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { listClinicalCasesByClient } from "@/lib/clinical-cases/supabase/clinical-case-repository";

function fakeClient(rows: unknown[] | null, error: unknown = null) {
  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    order: () => Promise.resolve({ data: rows, error }),
  };
  return { from: () => builder };
}

describe("listClinicalCasesByClient", () => {
  it("maps rows to the domain read shape", async () => {
    const client = fakeClient([
      {
        id: "11111111-1111-4111-8111-111111111111",
        client_id: "22222222-2222-4222-8222-222222222222",
        title: "Lower back",
        case_status: "open",
        severity: "moderate",
        summary: "intake",
        opened_on: "2026-06-01",
      },
    ]);
    const result = await listClinicalCasesByClient(
      "22222222-2222-4222-8222-222222222222",
      { client: client as never },
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Lower back");
    expect(result[0].openedOn).toBe("2026-06-01");
  });

  it("returns [] when the query errors", async () => {
    const client = fakeClient(null, { message: "denied" });
    const result = await listClinicalCasesByClient("22222222-2222-4222-8222-222222222222", {
      client: client as never,
    });
    expect(result).toEqual([]);
  });
});
