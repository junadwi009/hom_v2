"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getAuthMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { LoginActionState } from "./login-types";

const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Local Supabase auth mode is not enabled.",
    };
  }

  const parsed = loginInputSchema.safeParse({
    email: readFormText(formData, "email"),
    password: readFormText(formData, "password"),
  });

  if (!parsed.success) {
    return invalidCredentials();
  }

  const supabase = await createSupabaseServerClient();
  const response = await supabase.auth.signInWithPassword(parsed.data);

  if (response.error) {
    return invalidCredentials();
  }

  redirect("/");
}

export async function signOutAction() {
  if (getAuthMode() === "supabase") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

function invalidCredentials(): LoginActionState {
  return {
    status: "invalid_credentials",
    message: "Email or password is invalid.",
  };
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
