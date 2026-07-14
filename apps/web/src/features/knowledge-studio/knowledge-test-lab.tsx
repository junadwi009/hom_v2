"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { initialKnowledgeQueryState, type KnowledgeQueryState } from "./knowledge-action-types";
import { queryKnowledgeAction } from "./query-knowledge-action";

const SCOPES = [
  "public_chatbot",
  "internal_admin",
  "clinical_safety",
  "finance",
  "marketing",
  "owner_only",
] as const;

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";

export function KnowledgeTestLab() {
  const [state, formAction, pending] = useActionState(
    queryKnowledgeAction,
    initialKnowledgeQueryState,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Pertanyaan</span>
          <textarea
            className={textareaClassName}
            minLength={3}
            name="question"
            placeholder="Contoh: Berapa harga private session?"
            required
            rows={2}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Scope</span>
          <select className={inputClassName} defaultValue="public_chatbot" name="scope" required>
            {SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={pending} type="submit">
          {pending ? "Mencari…" : "Tanya"}
        </Button>
      </form>

      {state.status === "success" ? (
        <div className="space-y-2 border-t border-border-subtle pt-4">
          <p className="rounded-md border bg-background-card px-3 py-2 text-sm text-foreground">
            {state.answer}
          </p>
          {state.policyFlags.length > 0 ? (
            <p className="text-xs text-amber-700">
              Policy flags: {state.policyFlags.join(", ")}
            </p>
          ) : null}
          {state.sources.length > 0 ? (
            <ul className="space-y-1 text-xs text-foreground-muted">
              {state.sources.map((source, index) => (
                <li key={`${source.title}-${index}`}>
                  <strong>
                    [{index + 1}] {source.title}:
                  </strong>{" "}
                  {source.snippet}
                </li>
              ))}
            </ul>
          ) : null}
          {state.mode === "mock" ? (
            <p className="text-xs text-amber-700">Mode demo (tanpa OPENAI_API_KEY).</p>
          ) : null}
        </div>
      ) : null}

      <QueryFeedback state={state} />
    </div>
  );
}

function QueryFeedback({ state }: { state: KnowledgeQueryState }) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message}
    </p>
  );
}
