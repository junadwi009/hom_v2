"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";

import type { BusinessAgentQueryState } from "./business-agent-action-types";
import { initialBusinessAgentQueryState } from "./business-agent-action-types";
import { queryBusinessAgentAction } from "./query-business-agent-action";

const inputClassName =
  "min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";

type Turn = {
  question: string;
  answer: string;
  sources: { title: string; snippet: string }[];
  policyFlags: string[];
  mode: string;
};

export function AiBusinessAgentChat() {
  const [state, formAction, pending] = useActionState(
    queryBusinessAgentAction,
    initialBusinessAgentQueryState,
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [lastQuestion, setLastQuestion] = useState("");
  const [processedState, setProcessedState] = useState<BusinessAgentQueryState>(state);

  // Append a completed turn once the action state transitions to "success".
  // Adjusting state during render (instead of in a useEffect) avoids the
  // extra commit-then-effect render pass; React docs call this "adjusting
  // state when a prop changes" and it's the recommended escape hatch here.
  if (state !== processedState) {
    setProcessedState(state);
    if (state.status === "success") {
      setTurns((prev) => [
        ...prev,
        {
          question: lastQuestion,
          answer: state.answer,
          sources: state.sources,
          policyFlags: state.policyFlags,
          mode: state.mode,
        },
      ]);
    }
  }

  return (
    <div className="space-y-4">
      {turns.length > 0 ? (
        <ul className="space-y-4">
          {turns.map((turn, index) => (
            <li key={index} className="space-y-1 border-b border-border-subtle pb-4 last:border-b-0 last:pb-0">
              <p className="text-sm font-medium text-foreground">Anda: {turn.question}</p>
              <p className="rounded-md border bg-background-card px-3 py-2 text-sm text-foreground">
                {turn.answer}
              </p>
              {turn.policyFlags.length > 0 ? (
                <p className="text-xs text-amber-700">
                  Policy flags: {turn.policyFlags.join(", ")}
                </p>
              ) : null}
              {turn.sources.length > 0 ? (
                <ul className="space-y-1 text-xs text-foreground-muted">
                  {turn.sources.map((source, sourceIndex) => (
                    <li key={`${source.title}-${sourceIndex}`}>
                      <strong>
                        [{sourceIndex + 1}] {source.title}:
                      </strong>{" "}
                      {source.snippet}
                    </li>
                  ))}
                </ul>
              ) : null}
              {turn.mode === "mock" ? (
                <p className="text-xs text-amber-700">Mode demo (tanpa OPENAI_API_KEY).</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <form
        action={formAction}
        className="space-y-2"
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);
          setLastQuestion(String(formData.get("question") ?? ""));
        }}
      >
        <textarea
          className={inputClassName}
          minLength={3}
          name="question"
          placeholder="Tanya apa saja dari knowledge base…"
          required
          rows={2}
        />
        <Button disabled={pending} type="submit">
          {pending ? "Mencari…" : "Tanya"}
        </Button>
        {state.status !== "idle" && state.status !== "success" ? (
          <p className="text-sm text-red-600" role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
