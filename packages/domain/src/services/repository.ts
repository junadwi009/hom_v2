import type { Service, ServiceListQuery, ServiceListResult } from "./types";

export type ServiceRepository = {
  list(query?: Partial<ServiceListQuery>): Promise<ServiceListResult>;
  getById(id: string): Promise<Service | null>;
};
