export type LoginActionState = {
  status: "idle" | "configuration_error" | "invalid_credentials";
  message?: string;
};

export const initialLoginActionState: LoginActionState = {
  status: "idle",
};
