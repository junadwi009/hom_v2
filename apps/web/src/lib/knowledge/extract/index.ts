import "server-only";
import { extractImage } from "./image";
import { extractPdf } from "./pdf";
import { extractSpreadsheet } from "./spreadsheet";

export { extractImage, extractPdf, extractSpreadsheet };

export const SUPPORTED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export async function extractByMime(input: {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
}): Promise<{ text: string; confidence: number }> {
  const m = input.mimeType;
  if (m.includes("spreadsheet") || m.includes("ms-excel") || m === "text/csv") {
    return extractSpreadsheet(input.buffer);
  }
  if (m === "application/pdf") {
    const { text, confidence } = await extractPdf(input.buffer);
    return { text, confidence };
  }
  if (m === "image/png" || m === "image/jpeg") {
    return extractImage(input);
  }
  throw new Error("UNSUPPORTED_MIME");
}
