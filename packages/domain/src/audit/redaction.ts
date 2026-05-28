import type { AuditMetadata } from "./types";

const redactedValue = "[REDACTED]";

const sensitiveKeyFragments = [
  "api_key",
  "apikey",
  "clinical_note",
  "clinicalnote",
  "email",
  "message_text",
  "messagetext",
  "note_text",
  "notetext",
  "password",
  "payment",
  "phone",
  "raw_file",
  "secret",
  "token",
  "whatsapp",
] as const;

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function shouldRedactKey(key: string): boolean {
  const normalizedKey = normalizeKey(key);

  return sensitiveKeyFragments.some((fragment) =>
    normalizedKey.includes(normalizeKey(fragment)),
  );
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === "object") {
    return redactAuditMetadata(value as AuditMetadata);
  }

  return value;
}

export function redactAuditMetadata(metadata: AuditMetadata): AuditMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      shouldRedactKey(key) ? redactedValue : redactValue(value),
    ]),
  );
}
