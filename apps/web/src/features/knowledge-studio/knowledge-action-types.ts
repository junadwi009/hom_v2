export type KnowledgeUploadState =
  | { status: "idle" }
  | {
      status:
        | "configuration_error"
        | "auth_required"
        | "permission_denied"
        | "validation_error"
        | "unsupported_file"
        | "error";
      message: string;
    }
  | {
      status: "success";
      sourceId: string;
      title: string;
      extractedText: string;
      confidence: number;
      mode: "openai" | "mock";
    };

export const initialKnowledgeUploadState: KnowledgeUploadState = {
  status: "idle",
};
