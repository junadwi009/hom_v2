"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { loginAction } from "./auth-actions";
import { initialLoginActionState } from "./login-types";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>Email</span>
        <input
          autoComplete="email"
          className={inputClassName}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block space-y-2 text-sm font-medium text-foreground">
        <span>Password</span>
        <input
          autoComplete="current-password"
          className={inputClassName}
          name="password"
          required
          type="password"
        />
      </label>
      {state.message ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        <LockKeyhole aria-hidden="true" className="size-4" />
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted";
