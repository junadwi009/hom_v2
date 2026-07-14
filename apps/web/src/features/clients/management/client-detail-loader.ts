import "server-only";

import type { ClientClinicalCase } from "@hom/domain/clinical-cases";

import { getCurrentUser } from "@/lib/auth/current-user";
import { listClinicalCasesByClient } from "@/lib/clinical-cases/supabase/clinical-case-repository";
import { createAppointmentRepository } from "@/lib/appointments/repository-factory";
import { createPackageRepositories } from "@/lib/packages/repository-factory";
import { createPaymentRepositories } from "@/lib/payments/repository-factory";

import type {
  ClientAppointmentRow,
  ClientDetail,
  ClientDetailResult,
  MembershipSummary,
} from "./client-detail-types";
import { fetchAllPages } from "./paginate-all";

// Request a large page size when draining the full result set, to keep
// round-trips low while staying within the catalog schema's max (100).
const DRAIN_PAGE_SIZE = 100;

type PackageRow = {
  packageName: string;
  status: string;
  remainingSessions: number;
  totalSessions: number;
  expiresAt: string;
  active: boolean;
};

type PaidPaymentRow = {
  amountIdr: number;
  paidAt: string | null;
};

export type ClientDetailDeps = {
  permissions: string[];
  fetchPackages: (clientId: string) => Promise<PackageRow[]>;
  fetchAppointments: (clientId: string) => Promise<ClientAppointmentRow[]>;
  fetchPaidPayments: (clientId: string) => Promise<PaidPaymentRow[]>;
  fetchClinicalCases: (clientId: string) => Promise<ClientClinicalCase[]>;
};

const CAN_VIEW_PAYMENTS = "can_view_payments";
const CAN_VIEW_CLINICAL_CASES = "can_view_clinical_cases";
const CAN_MANAGE_CLINICAL_CASES = "can_manage_clinical_cases";

// Pure orchestration over injected deps — all gating/aggregation logic lives
// here so it is fully unit-testable without Supabase. The exported
// `loadClientDetail(clientId)` below wires the default (real) deps.
export async function loadClientDetailWithDeps(
  clientId: string,
  deps: ClientDetailDeps,
): Promise<ClientDetailResult> {
  try {
    const canViewPayments = deps.permissions.includes(CAN_VIEW_PAYMENTS);
    const canViewClinical =
      deps.permissions.includes(CAN_VIEW_CLINICAL_CASES) ||
      deps.permissions.includes(CAN_MANAGE_CLINICAL_CASES);

    const [packages, appointments] = await Promise.all([
      deps.fetchPackages(clientId),
      deps.fetchAppointments(clientId),
    ]);

    const paidPayments = canViewPayments
      ? await deps.fetchPaidPayments(clientId)
      : null;

    const clinicalCases = canViewClinical
      ? await deps.fetchClinicalCases(clientId)
      : null;

    const detail: ClientDetail = {
      clientId,
      membership: deriveMembership(packages),
      activity: deriveActivity(appointments),
      spend: paidPayments === null ? null : deriveSpend(paidPayments),
      appointments,
      notes:
        clinicalCases === null
          ? { access: "restricted" }
          : { access: "granted", cases: clinicalCases },
    };

    return { status: "ready", detail };
  } catch {
    return { status: "error" };
  }
}

function deriveMembership(packages: PackageRow[]): MembershipSummary | null {
  if (packages.length === 0) return null;

  const active = packages.filter((pkg) => pkg.active);
  if (active.length > 0) {
    return active.reduce((newest, current) =>
      Date.parse(current.expiresAt) > Date.parse(newest.expiresAt)
        ? current
        : newest,
    );
  }

  return packages[0] ?? null;
}

function deriveActivity(appointments: ClientAppointmentRow[]): {
  lastVisit: string | null;
  totalVisits: number;
} {
  const completed = appointments.filter((a) => a.status === "completed");
  let lastVisit: string | null = null;
  for (const appointment of completed) {
    if (lastVisit === null || Date.parse(appointment.startsAt) > Date.parse(lastVisit)) {
      lastVisit = appointment.startsAt;
    }
  }
  return { totalVisits: completed.length, lastVisit };
}

function deriveSpend(payments: PaidPaymentRow[]): {
  totalPaidIdr: number;
  lastPaymentAt: string | null;
} {
  let totalPaidIdr = 0;
  let lastPaymentAt: string | null = null;
  for (const payment of payments) {
    totalPaidIdr += payment.amountIdr;
    if (
      payment.paidAt !== null &&
      (lastPaymentAt === null || Date.parse(payment.paidAt) > Date.parse(lastPaymentAt))
    ) {
      lastPaymentAt = payment.paidAt;
    }
  }
  return { totalPaidIdr, lastPaymentAt };
}

// Thin, best-effort default deps builder — NOT unit-tested directly. Resolves
// the current user's permissions and wires the four fetchers to the real
// repositories, mapping each repo row into the small fetcher shapes the
// gating logic above expects.
async function buildDefaultDeps(): Promise<ClientDetailDeps> {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  return {
    permissions,
    fetchPackages: async (clientId) => {
      const repositories = await createPackageRepositories();
      const items = await fetchAllPages((page) =>
        repositories.clientPackages.list({
          clientId,
          page,
          pageSize: DRAIN_PAGE_SIZE,
        }),
      );
      return items.map((item) => ({
        packageName: item.packageName,
        status: item.status,
        remainingSessions: item.remainingSessions,
        totalSessions: item.totalSessions,
        expiresAt: item.expiresAt,
        active: item.status === "active",
      }));
    },
    fetchAppointments: async (clientId) => {
      const repository = await createAppointmentRepository();
      const items = await fetchAllPages((page) =>
        repository.list({ clientId, page, pageSize: DRAIN_PAGE_SIZE }),
      );
      return items.map((item) => ({
        id: item.id,
        startsAt: item.startsAt,
        serviceName: item.serviceName,
        practitionerName: item.practitionerName,
        status: item.status,
      }));
    },
    fetchPaidPayments: async (clientId) => {
      const repositories = await createPaymentRepositories();
      const items = await fetchAllPages((page) =>
        repositories.payments.list({
          clientId,
          status: "paid",
          page,
          pageSize: DRAIN_PAGE_SIZE,
        }),
      );
      return items.map((item) => ({
        amountIdr: item.amountIdr,
        paidAt: item.paidAt ?? null,
      }));
    },
    fetchClinicalCases: async (clientId) => listClinicalCasesByClient(clientId),
  };
}

export async function loadClientDetail(
  clientId: string,
  deps?: ClientDetailDeps,
): Promise<ClientDetailResult> {
  const resolvedDeps = deps ?? (await buildDefaultDeps());
  return loadClientDetailWithDeps(clientId, resolvedDeps);
}
