import type {
  Practitioner,
  PractitionerListQuery,
  PractitionerListResult,
} from "./types";

export type PractitionerRepository = {
  list(
    query?: Partial<PractitionerListQuery>,
  ): Promise<PractitionerListResult>;
  getById(id: string): Promise<Practitioner | null>;
};
