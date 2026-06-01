type AppointmentRepositoryErrorOptions = {
  operation: string;
  table: string;
  code?: string;
  status?: number;
};

export class AppointmentRepositoryError extends Error {
  readonly operation: string;
  readonly table: string;
  readonly code?: string;
  readonly status?: number;

  constructor(options: AppointmentRepositoryErrorOptions) {
    super("Appointment data could not be loaded.");
    this.name = "AppointmentRepositoryError";
    this.operation = options.operation;
    this.table = options.table;
    this.code = options.code;
    this.status = options.status;
  }

  static fromSupabase(
    operation: string,
    table: string,
    error: unknown,
  ): AppointmentRepositoryError {
    return new AppointmentRepositoryError({
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
