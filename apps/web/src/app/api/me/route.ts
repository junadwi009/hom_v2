import {
  apiError,
  apiSuccess,
} from "@hom/domain/api";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { SupabaseAuthBoundaryError } from "@/lib/auth/errors";
import { getAuthMode } from "@/lib/env/app-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return getMeResponse();
}

type GetMeResponseOptions = {
  loadCurrentUser?: typeof getCurrentUser;
};

export async function getMeResponse(options: GetMeResponseOptions = {}) {
  const authMode = getAuthMode();

  try {
    const user = await (options.loadCurrentUser ?? getCurrentUser)();

    if (!user) {
      return NextResponse.json(
        apiError({
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        }),
        { status: 401 },
      );
    }

    return NextResponse.json(
      apiSuccess(
        { user },
        {
          authMode,
        },
      ),
    );
  } catch (error) {
    if (error instanceof SupabaseAuthBoundaryError) {
      const status = error.code === "APP_USER_INACTIVE" ? 403 : 401;

      return NextResponse.json(
        apiError({
          code: status === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
          message:
            status === 403
              ? "Your studio profile is not active."
              : "Authentication is required.",
        }),
        { status },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        apiError({
          code: "INTERNAL_ERROR",
          message: "Current user data failed validation.",
        }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      apiError({
        code: "INTERNAL_ERROR",
        message: "Current user could not be loaded.",
      }),
      { status: 500 },
    );
  }
}
