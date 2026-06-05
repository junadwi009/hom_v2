import type { Client } from "@hom/domain/clients";

export type ClientDetail = {
  id: string;
  name: string;
  status: Client["status"];
  primaryPractitioner: string;
  maskedPhone: string | null;
  maskedEmail: string | null;
  created: string;
  updated: string;
};

export type ClientDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; detail: ClientDetail }
  | { status: "not_found" }
  | { status: "unavailable" };

export type ClientDetailAction = (
  clientId: string,
) => Promise<ClientDetailState>;

export const initialClientDetailState: ClientDetailState = { status: "idle" };
