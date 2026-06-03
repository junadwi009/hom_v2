export type AssignClientPackageClientOption = {
  id: string;
  label: string;
  status: "active" | "inactive" | "prospect";
};

export type AssignClientPackagePackageOption = {
  id: string;
  label: string;
  packageType: "session_pack" | "membership" | "intro";
  totalSessions: number;
  validityDays: number;
  priceIdr: number;
  status: "active";
};

export type AssignClientPackageOptions = {
  clients: AssignClientPackageClientOption[];
  packages: AssignClientPackagePackageOption[];
};

export type AssignClientPackageOptionsState =
  | {
      status: "ready";
      dataMode: "mock" | "supabase";
      options: AssignClientPackageOptions;
    }
  | {
      status: "permission_denied" | "configuration_error" | "error";
      dataMode: "mock" | "supabase";
    };

export type AssignClientPackageActionState = {
  status:
    | "idle"
    | "success"
    | "client_unavailable"
    | "package_unavailable"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "validation_error"
    | "unknown_error";
  message?: string;
  clientPackageId?: string;
};

export type AssignClientPackageFormAction = (
  previousState: AssignClientPackageActionState,
  formData: FormData,
) => Promise<AssignClientPackageActionState>;

export const initialAssignClientPackageActionState: AssignClientPackageActionState =
  {
    status: "idle",
  };
