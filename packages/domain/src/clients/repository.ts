import type { Client, ClientListQuery, ClientListResult } from "./types";

export type ClientRepository = {
  list(query?: Partial<ClientListQuery>): Promise<ClientListResult>;
  getById(id: string): Promise<Client | null>;
};
