import type { apiErrorCodes } from "./constants";

export type ApiErrorCode = (typeof apiErrorCodes)[number];

export type ApiMeta = Record<string, unknown>;

export type ApiErrorDetails = Record<string, unknown>;

export type ApiSuccessResponse<
  TData,
  TMeta extends ApiMeta = ApiMeta,
> = {
  ok: true;
  data: TData;
  meta: TMeta;
};

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  };
};

export type ApiResponse<TData, TMeta extends ApiMeta = ApiMeta> =
  | ApiSuccessResponse<TData, TMeta>
  | ApiErrorResponse;

export type ApiErrorInput = {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetails;
};
