import "server-only";

import {
  auditLogInputSchema,
  redactAuditMetadata,
  type AuditLogInput,
  type AuditMetadata,
} from "@hom/domain/audit";

export type ServerAuditLogSink = {
  append(input: AuditLogInput): Promise<void>;
};

export class UnsafeAuditMetadataError extends Error {
  constructor() {
    super("Audit metadata contains content that must not be logged.");
    this.name = "UnsafeAuditMetadataError";
  }
}

export function createServerAuditWriter(sink: ServerAuditLogSink) {
  return {
    async write(input: unknown) {
      const safeInput = prepareServerAuditLogInput(input);

      await sink.append(safeInput);

      return safeInput;
    },
  };
}

export function prepareServerAuditLogInput(input: unknown): AuditLogInput {
  const parsedInput = auditLogInputSchema.parse(input);

  assertNoDangerousMetadata(parsedInput.metadata);

  const metadata = redactAuditMetadata(parsedInput.metadata);

  assertNoDangerousMetadata(metadata);

  return {
    ...parsedInput,
    metadata,
  };
}

function assertNoDangerousMetadata(metadata: AuditMetadata) {
  visitMetadataValues(metadata, (value) => {
    if (dangerousValuePatterns.some((pattern) => pattern.test(value))) {
      throw new UnsafeAuditMetadataError();
    }
  });
}

function visitMetadataValues(
  value: unknown,
  visit: (value: string) => void,
) {
  if (typeof value === "string") {
    visit(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => visitMetadataValues(item, visit));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => visitMetadataValues(item, visit));
  }
}

const dangerousValuePatterns = [
  /\bs[k]-[a-z0-9_-]{8,}\b/i,
  /\bgh[p]_[a-z0-9_-]{8,}\b/i,
  /\bgithub_[p]at_[a-z0-9_-]{8,}\b/i,
  /\b(?:api[\s_-]?key|secret|token|password|authorization|bearer)\b\s*[:=]?\s+\S+/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\+\d[\d\s().-]{7,}\d/,
  /\b(?:clinical note|medical history|diagnosis|treatment note)\b/i,
  /\b(?:payment detail|card number|bank account|refund account)\b/i,
  /\b(?:whatsapp message|message content|chat transcript)\b/i,
] as const;
