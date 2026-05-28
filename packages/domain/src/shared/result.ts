export type Ok<T> = {
  ok: true;
  data: T;
};

export type Err<TCode extends string = string> = {
  ok: false;
  error: {
    code: TCode;
    message: string;
  };
};

export type Result<T, TCode extends string = string> = Ok<T> | Err<TCode>;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err<TCode extends string>(
  code: TCode,
  message: string,
): Err<TCode> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
