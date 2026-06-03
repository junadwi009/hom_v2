import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getAuthMode } from "@/lib/env/app-mode";

export default function LoginPage() {
  if (getAuthMode() === "mock") {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-app px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-background-card p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
          HOM Studio OS v2
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Studio sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Use an approved local studio account.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
