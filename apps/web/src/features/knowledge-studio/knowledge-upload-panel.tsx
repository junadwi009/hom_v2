"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialKnowledgePublishState,
  initialKnowledgeUploadState,
  type KnowledgePublishState,
  type KnowledgeUploadState,
} from "./knowledge-action-types";
import { publishKnowledgeAction } from "./publish-knowledge-action";
import { uploadKnowledgeAction } from "./upload-knowledge-action";

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
  "min-h-48 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";

export function KnowledgeUploadPanel() {
  const router = useRouter();
  const [upload, uploadFormAction, uploading] = useActionState(
    uploadKnowledgeAction,
    initialKnowledgeUploadState,
  );
  const [publish, publishFormAction, publishing] = useActionState(
    publishKnowledgeAction,
    initialKnowledgePublishState,
  );

  // Server actions cannot trigger navigation-adjacent side effects during
  // render, so the router refresh (to reflect the newly published source in
  // the sources table) happens here instead of inline in the JSX below.
  useEffect(() => {
    if (publish.status === "success") {
      router.refresh();
    }
  }, [publish.status, router]);

  return (
    <div className="space-y-4">
      <form action={uploadFormAction} className="space-y-3">
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Judul dokumen</span>
          <input
            className={inputClassName}
            name="title"
            placeholder="Judul dokumen"
            required
            type="text"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Tipe dokumen</span>
          <input
            className={inputClassName}
            name="docType"
            placeholder="pricing, sop, faq…"
            required
            type="text"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Scope</span>
          <select
            className={inputClassName}
            defaultValue="public_chatbot"
            name="scopes"
            required
          >
            {SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>File</span>
          <input
            accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
            className={inputClassName}
            name="file"
            required
            type="file"
          />
        </label>
        <Button disabled={uploading} type="submit">
          {uploading ? "Memproses…" : "Upload & Ekstrak"}
        </Button>
      </form>

      <UploadFeedback state={upload} />

      {upload.status === "success" ? (
        <form
          action={publishFormAction}
          className="space-y-3 border-t border-border-subtle pt-4"
        >
          <p className="text-sm text-foreground-muted">
            Tinjau teks hasil ekstraksi (confidence{" "}
            {Math.round(upload.confidence * 100)}%
            {upload.mode === "mock" ? ", mode demo" : ""}). Edit bila perlu
            sebelum publish.
          </p>
          <input name="sourceId" type="hidden" value={upload.sourceId} />
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Teks hasil ekstraksi</span>
            <textarea
              className={textareaClassName}
              defaultValue={upload.extractedText}
              name="extractedText"
              rows={12}
            />
          </label>
          <Button disabled={publishing} type="submit">
            {publishing ? "Menerbitkan…" : "Publish"}
          </Button>
          {publish.status === "success" ? (
            <p
              className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"
              role="status"
            >
              Terbit dengan {publish.chunkCount} chunk.
            </p>
          ) : null}
          <PublishFeedback state={publish} />
        </form>
      ) : null}
    </div>
  );
}

function UploadFeedback({ state }: { state: KnowledgeUploadState }) {
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

function PublishFeedback({ state }: { state: KnowledgePublishState }) {
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
