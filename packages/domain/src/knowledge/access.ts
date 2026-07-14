import type { PermissionKey } from "../rbac";
import type { KnowledgeScope } from "./types";

// Maps a user's permissions to the knowledge scopes they may retrieve from.
// Base scopes are always allowed for an agent user; sensitive scopes are gated.
export function allowedKnowledgeScopes(permissions: readonly PermissionKey[]): KnowledgeScope[] {
  const scopes: KnowledgeScope[] = ["public_chatbot", "internal_admin", "marketing"];
  if (permissions.includes("can_view_financials")) scopes.push("finance");
  if (permissions.includes("can_view_clinical_cases")) scopes.push("clinical_safety");
  if (permissions.includes("can_publish_knowledge")) scopes.push("owner_only");
  return scopes;
}
