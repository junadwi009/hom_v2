import { permissionKeys } from "./constants";
import type { PermissionKey, RoleName } from "./types";

export const rolePermissionMatrix = {
  super_admin: permissionKeys,
  studio_director: [
    "can_manage_users",
    "can_view_audit_logs",
    "can_view_clients",
    "can_manage_clients",
    "can_view_practitioners",
    "can_manage_practitioners",
    "can_manage_services",
    "can_view_team_attendance",
    "can_view_appointments",
    "can_manage_appointments",
    "can_reschedule_appointments",
    "can_manage_client_packages",
    "can_view_payments",
    "can_manage_payments",
    "can_view_clinical_cases",
    "can_manage_clinical_cases",
    "can_view_session_notes",
    "can_edit_session_notes",
    "can_request_note_unlock",
    "can_approve_note_unlock",
    "can_view_financials",
    "can_edit_financials",
    "can_export_financial_report",
    "can_approve_reimbursements",
    "can_view_whatsapp_inbox",
    "can_send_whatsapp_message",
    "can_approve_whatsapp_blast",
    "can_use_ai_business_agent",
    "can_view_ai_logs",
    "can_manage_knowledge",
    "can_publish_knowledge",
  ],
  admin_frontdesk: [
    "can_view_clients",
    "can_manage_clients",
    "can_view_practitioners",
    "can_view_team_attendance",
    "can_view_appointments",
    "can_manage_appointments",
    "can_reschedule_appointments",
    "can_view_whatsapp_inbox",
    "can_send_whatsapp_message",
  ],
  practitioner: [
    "can_view_clients",
    "can_view_appointments",
    "can_view_clinical_cases",
    "can_view_session_notes",
    "can_edit_session_notes",
    "can_request_note_unlock",
  ],
  finance_admin: [
    "can_view_clients",
    "can_view_payments",
    "can_manage_payments",
    "can_view_financials",
    "can_edit_financials",
    "can_export_financial_report",
  ],
  marketing_admin: [
    "can_view_clients",
    "can_view_whatsapp_inbox",
    "can_send_whatsapp_message",
  ],
  viewer: [],
  ai_agent_service: ["can_use_ai_business_agent"],
} as const satisfies Record<RoleName, readonly PermissionKey[]>;

export function getPermissionsForRoles(
  roles: readonly RoleName[],
): PermissionKey[] {
  return Array.from(
    new Set(roles.flatMap((role) => rolePermissionMatrix[role])),
  );
}
