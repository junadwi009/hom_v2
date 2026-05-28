import type {
  ApiErrorInput,
  ApiErrorResponse,
  ApiMeta,
  ApiSuccessResponse,
} from "./types";

export function apiSuccess<TData, TMeta extends ApiMeta = ApiMeta>(
  data: TData,
  meta?: TMeta,
): ApiSuccessResponse<TData, TMeta> {
  return {
    ok: true,
    data,
    meta: (meta ?? {}) as TMeta,
  };
}

export function apiError(input: ApiErrorInput): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      ...(input.details ? { details: input.details } : {}),
    },
  };
}
