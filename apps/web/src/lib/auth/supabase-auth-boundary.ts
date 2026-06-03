import "server-only";

import {
  currentUserSchema,
  type AuthBoundary,
  type CurrentUser,
} from "@hom/domain/auth";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SupabaseAuthBoundaryError } from "./errors";

type CurrentAppUserContextRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
};

type SupabaseAuthClient = {
  auth: {
    getUser(): PromiseLike<{
      data: {
        user: { id: string } | null;
      };
      error: unknown;
    }>;
  };
  rpc(
    functionName: "get_current_app_user_context",
  ): PromiseLike<{
    data: CurrentAppUserContextRow[] | null;
    error: unknown;
  }>;
};

type CreateSupabaseAuthBoundaryOptions = {
  createSupabaseClient?: () => Promise<SupabaseAuthClient>;
};

export function createSupabaseAuthBoundary(
  options: CreateSupabaseAuthBoundaryOptions = {},
): AuthBoundary {
  return {
    async getCurrentUser() {
      const supabase = await getSupabaseClient(options);
      const response = await supabase.auth.getUser();

      if (response.error || !response.data.user) {
        return null;
      }

      return loadCurrentAppUserContext(supabase);
    },

    async requireAuthenticatedUser() {
      const supabase = await getSupabaseClient(options);
      const response = await supabase.auth.getUser();

      if (response.error || !response.data.user) {
        throw new SupabaseAuthBoundaryError("AUTH_REQUIRED");
      }

      return loadCurrentAppUserContext(supabase);
    },
  };
}

async function getSupabaseClient(options: CreateSupabaseAuthBoundaryOptions) {
  return options.createSupabaseClient
    ? options.createSupabaseClient()
    : ((await createSupabaseServerClient()) as unknown as SupabaseAuthClient);
}

async function loadCurrentAppUserContext(
  supabase: SupabaseAuthClient,
): Promise<CurrentUser> {
  const response = await supabase.rpc("get_current_app_user_context");

  if (response.error) {
    throw mapContextError(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new SupabaseAuthBoundaryError("APP_USER_REQUIRED");
  }

  return currentUserSchema.parse({
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    roles: row.roles,
    permissions: row.permissions,
  });
}

function mapContextError(error: unknown) {
  const message = readOptionalString(error, "message");

  if (message?.includes("APP_USER_INACTIVE")) {
    return new SupabaseAuthBoundaryError("APP_USER_INACTIVE");
  }

  if (message?.includes("APP_USER_REQUIRED")) {
    return new SupabaseAuthBoundaryError("APP_USER_REQUIRED");
  }

  if (message?.includes("AUTH_REQUIRED")) {
    return new SupabaseAuthBoundaryError("AUTH_REQUIRED");
  }

  return new SupabaseAuthBoundaryError("AUTH_CONTEXT_FAILED");
}

function readOptionalString(value: unknown, key: string) {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}
