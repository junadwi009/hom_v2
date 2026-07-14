type KnowledgeRepositoryErrorOptions = {
  operation: string;
  table: string;
  code?: string;
  status?: number;
};

export class KnowledgeRepositoryError extends Error {
  readonly operation: string;
  readonly table: string;
  readonly code?: string;
  readonly status?: number;

  constructor(options: KnowledgeRepositoryErrorOptions) {
    super("Knowledge data could not be loaded.");
    this.name = "KnowledgeRepositoryError";
    this.operation = options.operation;
    this.table = options.table;
    this.code = options.code;
    this.status = options.status;
  }

  static fromSupabase(
    operation: string,
    table: string,
    error: unknown,
  ): KnowledgeRepositoryError {
    return new KnowledgeRepositoryError({
      operation,
      table,
      code: readOptionalString(error, "code"),
      status: readOptionalNumber(error, "status"),
    });
  }
}

function readOptionalString(value: unknown, key: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];
  return typeof property === "string" ? property : undefined;
}

function readOptionalNumber(value: unknown, key: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];
  return typeof property === "number" ? property : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
