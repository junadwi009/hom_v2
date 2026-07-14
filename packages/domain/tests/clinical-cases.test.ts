import { describe, expect, it } from "vitest";
import {
  clientClinicalCaseSchema,
  clinicalCaseListByClientQuerySchema,
} from "../src/clinical-cases";

describe("clientClinicalCaseSchema", () => {
  it("parses a valid clinical case read row", () => {
    const parsed = clientClinicalCaseSchema.parse({
      id: "10000000-0000-4000-8000-000000000001",
      clientId: "20000000-0000-4000-8000-000000000002",
      title: "Lower back assessment",
      caseStatus: "open",
      severity: "moderate",
      summary: "Initial intake",
      openedOn: "2026-06-01",
    });
    expect(parsed.title).toBe("Lower back assessment");
    expect(parsed.summary).toBe("Initial intake");
  });

  it("allows a null summary", () => {
    const parsed = clientClinicalCaseSchema.parse({
      id: "30000000-0000-4000-8000-000000000003",
      clientId: "40000000-0000-4000-8000-000000000004",
      title: "Follow-up",
      caseStatus: "open",
      severity: "low",
      summary: null,
      openedOn: "2026-06-02",
    });
    expect(parsed.summary).toBeNull();
  });

  it("rejects an empty title", () => {
    expect(() =>
      clientClinicalCaseSchema.parse({
        id: "40000000-0000-4000-8000-000000000001",
        clientId: "50000000-0000-4000-8000-000000000002",
        title: "",
        caseStatus: "open",
        severity: "low",
        summary: null,
        openedOn: "2026-06-02",
      }),
    ).toThrow();
  });

  it("validates the list-by-client query", () => {
    const q = clinicalCaseListByClientQuerySchema.parse({
      clientId: "50000000-0000-4000-8000-000000000005",
    });
    expect(q.clientId).toBeTruthy();
  });
});
