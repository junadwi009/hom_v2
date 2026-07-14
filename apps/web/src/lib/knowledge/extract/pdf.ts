import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdf(
  buffer: ArrayBuffer,
): Promise<{ text: string; confidence: number; needsVision: boolean }> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = (Array.isArray(text) ? text.join("\n") : text).trim();
  const needsVision = clean.length < 20; // scanned PDF: little/no text layer
  return { text: clean, confidence: needsVision ? 0.2 : 0.85, needsVision };
}
