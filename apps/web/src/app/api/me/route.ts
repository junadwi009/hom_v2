import {
  apiError,
  apiSuccess,
} from "@hom/domain/api";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode } from "@/lib/env/app-mode";

export const dynamic = "force-dynamic";

const supabaseAuthNotImplementedMessage =
  "Supabase auth mode is not enabled in Phase 3A. Keep HOM_AUTH_MODE=mock until real auth is approved.";

export async function GET() {
  const authMode = getAuthMode();

  try {
    const user = await getCurrentUser();

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
    if (authMode === "supabase") {
      return NextResponse.json(
        apiError({
          code: "NOT_IMPLEMENTED",
          message: supabaseAuthNotImplementedMessage,
        }),
        { status: 501 },
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
