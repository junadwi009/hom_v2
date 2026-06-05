export type AdminUserRpcRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  status: string;
  roles: string[] | null;
  created_at: string;
  updated_at: string;
};

export type AdminUserRpcResponse = {
  data: AdminUserRpcRow[] | null;
  error: unknown;
};

type ProvisionAppUserParams = {
  p_auth_user_id: string;
  p_full_name: string;
  p_email: string;
  p_role_names: string[];
};

type SetAppUserStatusParams = {
  p_target_user_id: string;
  p_status: string;
};

type SetAppUserRolesParams = {
  p_target_user_id: string;
  p_role_names: string[];
};

// Authenticated server client narrowed to the user-management RPCs. The RPCs
// enforce can_manage_users via the caller's JWT, so this client carries the
// manager's session (NOT the service-role key).
export type AdminUserRpcClient = {
  rpc(functionName: "list_app_users"): PromiseLike<AdminUserRpcResponse>;
  rpc(
    functionName: "provision_app_user",
    params: ProvisionAppUserParams,
  ): PromiseLike<AdminUserRpcResponse>;
  rpc(
    functionName: "set_app_user_status",
    params: SetAppUserStatusParams,
  ): PromiseLike<AdminUserRpcResponse>;
  rpc(
    functionName: "set_app_user_roles",
    params: SetAppUserRolesParams,
  ): PromiseLike<AdminUserRpcResponse>;
};
