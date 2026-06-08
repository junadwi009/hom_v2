"use client";

import { SendHorizontal } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/features/shell/toast";

// Presentational ask box. Wire to the AI Business Agent action when available.
export function AiAskInput() {
  const [value, setValue] = useState("");
  const notify = useToast();

  return (
    <form
      className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() === "") return;
        notify(`Pertanyaan dikirim ke AI: "${value.trim()}" (demo).`);
        setValue("");
      }}
    >
      <input
        aria-label="Tanya AI tentang bisnis Anda"
        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Tanya AI tentang bisnis Anda..."
        value={value}
      />
      <button
        aria-label="Kirim pertanyaan"
        className="flex size-7 items-center justify-center rounded-md bg-foreground text-background transition-colors hover:bg-stone-800"
        type="submit"
      >
        <SendHorizontal aria-hidden="true" className="size-4" />
      </button>
    </form>
  );
}
