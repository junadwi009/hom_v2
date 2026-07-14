import { EMBEDDING_DIM, type EmbeddingVector } from "./types";

// Deterministic hash-based pseudo-embedding: stable across runs, offline-safe.
export function mockEmbed(text: string): EmbeddingVector {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vec[(code + i) % EMBEDDING_DIM] += ((code % 17) + 1) / 17;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
export function mockVisionExtract(fileName: string): string {
  return `[mock vision extraction for ${fileName}] (set OPENAI_API_KEY to enable real OCR)`;
}
export function mockAnswer(question: string, contexts: string[]): string {
  const snippet = contexts[0]?.slice(0, 160) ?? "(tidak ada konteks)";
  return `[demo] Berdasarkan sumber: "${snippet}". (Pertanyaan: ${question})`;
}
