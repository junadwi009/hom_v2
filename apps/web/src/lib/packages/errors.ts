type PackageRepositoryErrorOptions = {
  operation: string;
  table: string;
  code?: string;
  status?: number;
};

export class PackageRepositoryError extends Error {
  readonly operation: string;
  readonly table: string;
  readonly code?: string;
  readonly status?: number;

  constructor(options: PackageRepositoryErrorOptions) {
    super("Package data could not be loaded.");
    this.name = "PackageRepositoryError";
    this.operation = options.operation;
    this.table = options.table;
    this.code = options.code;
    this.status = options.status;
  }

  static fromSupabase(
    operation: string,
    table: string,
    error: unknown,
  ): PackageRepositoryError {
    return new PackageRepositoryError({
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
