export type BusinessAgentQueryState =
  | { status: "idle" }
  | {
      status:
        | "configuration_error"
        | "auth_required"
        | "permission_denied"
        | "validation_error"
        | "error";
      message: string;
    }
  | {
      status: "success";
      answer: string;
      sources: { title: string; snippet: string }[];
      policyFlags: string[];
      mode: "openai" | "mock";
    };

export const initialBusinessAgentQueryState: BusinessAgentQueryState = {
  status: "idle",
};
