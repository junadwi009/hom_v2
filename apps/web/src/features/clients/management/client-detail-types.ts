import type { ClientClinicalCase } from "@hom/domain/clinical-cases";

export type MembershipSummary = {
  packageName: string;
  status: string;          // client_package status verbatim
  remainingSessions: number;
  totalSessions: number;
  expiresAt: string;
  active: boolean;
};

export type SpendSummary = {
  totalPaidIdr: number;
  lastPaymentAt: string | null;
};

export type ClientAppointmentRow = {
  id: string;
  startsAt: string;
  serviceName: string;
  practitionerName: string;
  status: string;          // scheduled|confirmed|completed|cancelled|no_show
};

export type ClientNotes =
  | { access: "granted"; cases: ClientClinicalCase[] }
  | { access: "restricted" };

export type ClientDetail = {
  clientId: string;
  membership: MembershipSummary | null;
  activity: { lastVisit: string | null; totalVisits: number };
  spend: SpendSummary | null;   // null when viewer lacks can_view_payments
  appointments: ClientAppointmentRow[];
  notes: ClientNotes;
};

export type ClientDetailResult =
  | { status: "ready"; detail: ClientDetail }
  | { status: "permission_denied" }
  | { status: "error" };
