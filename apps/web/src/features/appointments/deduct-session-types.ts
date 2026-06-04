export type DeductSessionPackageOption = {
  id: string;
  packageName: string;
  remainingSessions: number;
  totalSessions: number;
  expiresAt: string;
};

export type DeductSessionOptionsState =
  | {
      status: "ready";
      dataMode: "mock" | "supabase";
      alreadyDeducted: boolean;
      packages: DeductSessionPackageOption[];
    }
  | {
      status: "permission_denied" | "configuration_error" | "error";
      dataMode: "mock" | "supabase";
    };

export type DeductSessionActionState = {
  status:
    | "idle"
    | "success"
    | "already_deducted"
    | "package_unavailable"
    | "appointment_not_completed"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "validation_error"
    | "unknown_error";
  message?: string;
  clientPackageId?: string;
};

export type DeductSessionFormAction = (
  previousState: DeductSessionActionState,
  formData: FormData,
) => Promise<DeductSessionActionState>;

export const initialDeductSessionActionState: DeductSessionActionState = {
  status: "idle",
};

export type DeductSessionPreview = {
  before: number;
  after: number;
};

export function toDeductSessionPreview(
  remainingSessions: number,
): DeductSessionPreview {
  return {
    before: remainingSessions,
    after: Math.max(remainingSessions - 1, 0),
  };
}
