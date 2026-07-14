import "server-only";
import * as XLSX from "xlsx";

export function extractSpreadsheet(buffer: ArrayBuffer): { text: string; confidence: number } {
  const wb = XLSX.read(buffer, { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
    if (rows.length === 0) continue;
    const [header, ...body] = rows;
    parts.push(`# Sheet: ${name}`);
    for (const row of body) {
      const line = row
        .map((cell, i) => `${header?.[i] ?? `col${i}`}: ${cell ?? ""}`)
        .join(" | ");
      if (line.trim()) parts.push(line);
    }
  }
  const text = parts.join("\n");
  return { text, confidence: text.length > 0 ? 0.95 : 0 };
}
