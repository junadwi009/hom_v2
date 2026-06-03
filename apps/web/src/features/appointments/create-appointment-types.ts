export type AppointmentClientOption = {
  id: string;
  label: string;
  status: "active" | "inactive" | "prospect";
};

export type AppointmentPractitionerOption = {
  id: string;
  label: string;
  status: "active";
};

export type AppointmentServiceOption = {
  id: string;
  label: string;
  status: "active";
  durationMinutes: number;
};

export type CreateAppointmentOptions = {
  clients: AppointmentClientOption[];
  practitioners: AppointmentPractitionerOption[];
  services: AppointmentServiceOption[];
};

export type CreateAppointmentOptionsState =
  | {
      status: "ready";
      dataMode: "mock" | "supabase";
      options: CreateAppointmentOptions;
    }
  | {
      status: "permission_denied" | "configuration_error" | "error";
      dataMode: "mock" | "supabase";
    };

export type CreateAppointmentActionState = {
  status:
    | "idle"
    | "success"
    | "appointment_overlap"
    | "client_unavailable"
    | "practitioner_unavailable"
    | "service_unavailable"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "validation_error"
    | "unknown_error";
  message?: string;
  appointmentId?: string;
};

export type CreateAppointmentFormAction = (
  previousState: CreateAppointmentActionState,
  formData: FormData,
) => Promise<CreateAppointmentActionState>;

export const initialCreateAppointmentActionState: CreateAppointmentActionState =
  {
    status: "idle",
  };
