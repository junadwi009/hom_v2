import { describe, expect, it, beforeEach, vi } from "vitest";
import * as XLSX from "xlsx";

vi.mock("server-only", () => ({}));

import { extractSpreadsheet } from "@/lib/knowledge/extract/spreadsheet";

function makeXlsx(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([["Service", "Price"], ["Private", 550000]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("extractSpreadsheet", () => {
  it("extracts header + row text", () => {
    const { text, confidence } = extractSpreadsheet(makeXlsx());
    expect(text).toContain("Service");
    expect(text).toContain("550000");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("extractByMime image path (mock gateway)", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });
  it("uses vision extraction for images", async () => {
    const { extractByMime } = await import("@/lib/knowledge/extract");
    const r = await extractByMime({ buffer: new ArrayBuffer(4), mimeType: "image/png", fileName: "a.png" });
    expect(r.text).toContain("mock vision extraction");
  });
});
