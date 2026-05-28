import { describe, expect, it } from "vitest";

import {
  PermissionDeniedError,
  getPermissionsForRoles,
  hasPermission,
  knowledgeSourceStatusSchema,
  permissionKeySchema,
  permissionKeys,
  requireAnyPermission,
  requirePermission,
  roleNameSchema,
  roleNames,
  rolePermissionMatrix,
  type PermissionKey,
  type RoleName,
} from "../src/rbac";

describe("RBAC constants and schemas", () => {
  it("accepts only canonical role names", () => {
    expect(roleNameSchema.safeParse("studio_director").success).toBe(true);
    expect(roleNameSchema.safeParse("owner").success).toBe(false);
  });

  it("accepts only canonical permission keys", () => {
    expect(permissionKeySchema.safeParse("can_view_clients").success).toBe(
      true,
    );
    expect(permissionKeySchema.safeParse("view_clients").success).toBe(false);
  });

  it("accepts only canonical knowledge source statuses", () => {
    expect(knowledgeSourceStatusSchema.safeParse("review_needed").success).toBe(
      true,
    );
    expect(
      knowledgeSourceStatusSchema.safeParse("review_required").success,
    ).toBe(false);
  });

  it("keeps the role permission matrix within canonical roles and permissions", () => {
    for (const [role, permissions] of Object.entries(
      rolePermissionMatrix,
    ) as Array<[RoleName, readonly PermissionKey[]]>) {
      expect(roleNames).toContain(role);

      for (const permission of permissions) {
        expect(permissionKeys).toContain(permission);
      }
    }
  });

  it("gives super_admin every canonical permission", () => {
    expect(rolePermissionMatrix.super_admin).toEqual(permissionKeys);
  });

  it("keeps role and permission management limited to super_admin", () => {
    const rolesWithPermission = roleNames.filter((role) =>
      (rolePermissionMatrix[role] as readonly PermissionKey[]).includes(
        "can_manage_roles_permissions",
      ),
    );

    expect(rolesWithPermission).toEqual(["super_admin"]);
  });

  it("keeps reimbursement approval limited to super_admin and studio_director", () => {
    const rolesWithPermission = roleNames.filter((role) =>
      (rolePermissionMatrix[role] as readonly PermissionKey[]).includes(
        "can_approve_reimbursements",
      ),
    );

    expect(rolesWithPermission).toEqual(["super_admin", "studio_director"]);
  });

  it("keeps knowledge management and publishing limited to owner-level roles", () => {
    const knowledgePermissions: PermissionKey[] = [
      "can_manage_knowledge",
      "can_publish_knowledge",
    ];

    for (const permission of knowledgePermissions) {
      const rolesWithPermission = roleNames.filter((role) =>
        (rolePermissionMatrix[role] as readonly PermissionKey[]).includes(
          permission,
        ),
      );

      expect(rolesWithPermission).toEqual(["super_admin", "studio_director"]);
    }
  });
});

describe("RBAC helpers", () => {
  it("merges permissions for multiple roles without duplicates", () => {
    const permissions = getPermissionsForRoles([
      "admin_frontdesk",
      "marketing_admin",
    ]);

    expect(permissions).toContain("can_manage_clients");
    expect(permissions).toContain("can_send_whatsapp_message");
    expect(new Set(permissions).size).toBe(permissions.length);
  });

  it("checks whether an actor has a permission", () => {
    const actor = {
      permissions: ["can_view_clients"] satisfies PermissionKey[],
    };

    expect(hasPermission(actor, "can_view_clients")).toBe(true);
    expect(hasPermission(actor, "can_view_financials")).toBe(false);
  });

  it("allows requirePermission when the actor has the permission", () => {
    const actor = {
      permissions: ["can_view_audit_logs"] satisfies PermissionKey[],
    };

    expect(() => requirePermission(actor, "can_view_audit_logs")).not.toThrow();
  });

  it("throws PermissionDeniedError when a permission is missing", () => {
    const actor = {
      permissions: ["can_view_clients"] satisfies PermissionKey[],
    };

    expect(() => requirePermission(actor, "can_edit_financials")).toThrow(
      PermissionDeniedError,
    );
  });

  it("allows requireAnyPermission when one option is present", () => {
    const actor = {
      permissions: ["can_view_clients"] satisfies PermissionKey[],
    };

    expect(() =>
      requireAnyPermission(actor, [
        "can_view_financials",
        "can_view_clients",
      ]),
    ).not.toThrow();
  });

  it("throws when none of the requested permissions are present", () => {
    const actor = {
      permissions: ["can_view_clients"] satisfies PermissionKey[],
    };

    expect(() =>
      requireAnyPermission(actor, [
        "can_edit_financials",
        "can_view_audit_logs",
      ]),
    ).toThrow(PermissionDeniedError);
  });
});
