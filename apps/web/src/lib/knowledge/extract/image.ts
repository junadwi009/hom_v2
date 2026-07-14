import "server-only";
import { extractImageText } from "@/lib/ai/gateway";

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}
export async function extractImage(input: {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
}): Promise<{ text: string; confidence: number }> {
  const text = await extractImageText({
    base64: toBase64(input.buffer),
    mimeType: input.mimeType,
    fileName: input.fileName,
  });
  return { text, confidence: text.startsWith("[mock") ? 0.3 : 0.75 };
}
