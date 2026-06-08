export type CreateSegmentActionState = {
  status:
    | "idle"
    | "success"
    | "validation_error"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "unknown_error";
  message?: string;
  segmentId?: string;
};

export type CreateSegmentFormAction = (
  previousState: CreateSegmentActionState,
  formData: FormData,
) => Promise<CreateSegmentActionState>;

export const initialCreateSegmentActionState: CreateSegmentActionState = {
  status: "idle",
};
