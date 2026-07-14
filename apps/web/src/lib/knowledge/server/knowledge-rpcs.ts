import "server-only";

import {
  knowledgeSourceSchema,
  type KnowledgeSource,
} from "@hom/domain/knowledge";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type KnowledgeSourceRpcRow = {
  id: string;
  title: string;
  doc_type: string;
  scopes: string[];
  status: string;
  version: number;
  confidence: number | null;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeChunkMatchRow = {
  source_id: string;
  source_title: string;
  chunk_index: number;
  content: string;
  distance: number;
};

type KnowledgeRpcResponse<TRow> = {
  data: TRow[] | null;
  error: unknown;
};

export type CreateKnowledgeSourceRpcParams = {
  p_title: string;
  p_doc_type: string;
  p_scopes: string[];
  p_storage_path: string;
  p_mime_type: string;
  p_file_size: number;
  p_checksum: string | null;
};

export type SetKnowledgeSourceExtractedRpcParams = {
  p_id: string;
  p_extracted_text: string;
  p_confidence: number;
};

export type FailKnowledgeSourceRpcParams = {
  p_id: string;
  p_error: string;
};

export type PublishKnowledgeSourceRpcParams = {
  p_id: string;
  p_extracted_text: string;
  p_chunks: {
    index: number;
    content: string;
    embedding: number[];
    tokenCount: number;
  }[];
};

export type MatchKnowledgeChunksRpcParams = {
  p_query_embedding: string;
  p_scopes: string[];
  p_match_count: number;
};

export type KnowledgeRpcClient = {
  rpc(
    functionName: "create_knowledge_source",
    params: CreateKnowledgeSourceRpcParams,
  ): PromiseLike<KnowledgeRpcResponse<KnowledgeSourceRpcRow>>;
  rpc(
    functionName: "set_knowledge_source_extracted",
    params: SetKnowledgeSourceExtractedRpcParams,
  ): PromiseLike<KnowledgeRpcResponse<KnowledgeSourceRpcRow>>;
  rpc(
    functionName: "fail_knowledge_source",
    params: FailKnowledgeSourceRpcParams,
  ): PromiseLike<KnowledgeRpcResponse<KnowledgeSourceRpcRow>>;
  rpc(
    functionName: "publish_knowledge_source",
    params: PublishKnowledgeSourceRpcParams,
  ): PromiseLike<KnowledgeRpcResponse<KnowledgeSourceRpcRow>>;
  rpc(
    functionName: "match_knowledge_chunks",
    params: MatchKnowledgeChunksRpcParams,
  ): PromiseLike<KnowledgeRpcResponse<KnowledgeChunkMatchRow>>;
};

type KnowledgeRpcOptions = {
  createSupabaseClient?: () => Promise<KnowledgeRpcClient>;
};

const KNOWN_KNOWLEDGE_RPC_CODES = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "SOURCE_NOT_FOUND",
  "CHUNKS_REQUIRED",
  "CHUNK_INVALID",
  "TITLE_REQUIRED",
  "SCOPES_REQUIRED",
] as const;

type KnownKnowledgeRpcCode = (typeof KNOWN_KNOWLEDGE_RPC_CODES)[number];

export type KnowledgeRpcCode = KnownKnowledgeRpcCode | "KNOWLEDGE_RPC_FAILED";

export class KnowledgeRpcError extends Error {
  readonly code: KnowledgeRpcCode;

  constructor(code: KnowledgeRpcCode) {
    super(code);
    this.name = "KnowledgeRpcError";
    this.code = code;
  }

  static from(message: string | undefined): KnowledgeRpcError {
    const hit = KNOWN_KNOWLEDGE_RPC_CODES.find((candidate) =>
      (message ?? "").includes(candidate),
    );

    return new KnowledgeRpcError(hit ?? "KNOWLEDGE_RPC_FAILED");
  }

  static fromSupabase(error: unknown): KnowledgeRpcError {
    return KnowledgeRpcError.from(readOptionalString(error, "message"));
  }
}

export async function rpcCreateSource(
  args: {
    title: string;
    docType: string;
    scopes: string[];
    storagePath: string;
    mimeType: string;
    fileSize: number;
    checksum: string | null;
  },
  options: KnowledgeRpcOptions = {},
): Promise<KnowledgeSource> {
  const supabase = await resolveKnowledgeRpcClient(options);
  const { data, error } = await supabase.rpc("create_knowledge_source", {
    p_title: args.title,
    p_doc_type: args.docType,
    p_scopes: args.scopes,
    p_storage_path: args.storagePath,
    p_mime_type: args.mimeType,
    p_file_size: args.fileSize,
    p_checksum: args.checksum,
  });

  if (error) {
    throw KnowledgeRpcError.fromSupabase(error);
  }

  return mapFirstRow(data);
}

export async function rpcSetExtracted(
  args: { id: string; text: string; confidence: number },
  options: KnowledgeRpcOptions = {},
): Promise<KnowledgeSource> {
  const supabase = await resolveKnowledgeRpcClient(options);
  const { data, error } = await supabase.rpc(
    "set_knowledge_source_extracted",
    {
      p_id: args.id,
      p_extracted_text: args.text,
      p_confidence: args.confidence,
    },
  );

  if (error) {
    throw KnowledgeRpcError.fromSupabase(error);
  }

  return mapFirstRow(data);
}

export async function rpcFail(
  args: { id: string; error: string },
  options: KnowledgeRpcOptions = {},
): Promise<void> {
  const supabase = await resolveKnowledgeRpcClient(options);
  const { error } = await supabase.rpc("fail_knowledge_source", {
    p_id: args.id,
    p_error: args.error,
  });

  if (error) {
    throw KnowledgeRpcError.fromSupabase(error);
  }
}

export async function rpcPublish(
  args: {
    id: string;
    text: string;
    chunks: {
      index: number;
      content: string;
      embedding: number[];
      tokenCount: number;
    }[];
  },
  options: KnowledgeRpcOptions = {},
): Promise<KnowledgeSource> {
  const supabase = await resolveKnowledgeRpcClient(options);
  const { data, error } = await supabase.rpc("publish_knowledge_source", {
    p_id: args.id,
    p_extracted_text: args.text,
    p_chunks: args.chunks,
  });

  if (error) {
    throw KnowledgeRpcError.fromSupabase(error);
  }

  return mapFirstRow(data);
}

export async function rpcMatch(
  args: { embedding: number[]; scopes: string[]; matchCount: number },
  options: KnowledgeRpcOptions = {},
): Promise<
  {
    sourceId: string;
    sourceTitle: string;
    chunkIndex: number;
    content: string;
    distance: number;
  }[]
> {
  const supabase = await resolveKnowledgeRpcClient(options);
  // pgvector's `vector` parameter rejects a raw JS array over PostgREST;
  // it must be sent as its string literal form, e.g. "[0.1,0.2,...]".
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    p_query_embedding: JSON.stringify(args.embedding),
    p_scopes: args.scopes,
    p_match_count: args.matchCount,
  });

  if (error) {
    throw KnowledgeRpcError.fromSupabase(error);
  }

  return (data ?? []).map((row) => ({
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    chunkIndex: row.chunk_index,
    content: row.content,
    distance: row.distance,
  }));
}

function mapFirstRow(
  data: KnowledgeSourceRpcRow[] | null,
): KnowledgeSource {
  const row = data?.[0];

  if (!row) {
    throw new KnowledgeRpcError("KNOWLEDGE_RPC_FAILED");
  }

  return mapKnowledgeSourceRpcRow(row);
}

function mapKnowledgeSourceRpcRow(row: KnowledgeSourceRpcRow): KnowledgeSource {
  return knowledgeSourceSchema.parse({
    id: row.id,
    title: row.title,
    docType: row.doc_type,
    scopes: row.scopes,
    status: row.status,
    version: row.version,
    confidence: row.confidence,
    extractedText: row.extracted_text ?? null,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

async function resolveKnowledgeRpcClient(
  options: KnowledgeRpcOptions,
): Promise<KnowledgeRpcClient> {
  return options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createKnowledgeRpcClient();
}

async function createKnowledgeRpcClient(): Promise<KnowledgeRpcClient> {
  return (await createSupabaseServerClient()) as unknown as KnowledgeRpcClient;
}

function readOptionalString(value: unknown, key: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];
  return typeof property === "string" ? property : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
