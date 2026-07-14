import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientDetailView } from "./client-detail-panel";
import type { ClientDetail, ClientDetailResult } from "./client-detail-types";

const baseDetail: ClientDetail = {
  clientId: "10000000-0000-4000-8000-000000000001",
  membership: {
    packageName: "Monthly Unlimited",
    status: "active",
    remainingSessions: 5,
    totalSessions: 30,
    expiresAt: "2026-08-01",
    active: true,
  },
  activity: { lastVisit: "2026-07-10", totalVisits: 28 },
  spend: { totalPaidIdr: 6_250_000, lastPaymentAt: "2026-07-01" },
  appointments: [
    {
      id: "20000000-0000-4000-8000-000000000001",
      startsAt: "2026-07-10",
      serviceName: "Vinyasa Flow",
      practitionerName: "Raka",
      status: "completed",
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      startsAt: "2026-06-28",
      serviceName: "Mat Pilates",
      practitionerName: "Dinda",
      status: "no_show",
    },
  ],
  notes: {
    access: "granted",
    cases: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        clientId: "10000000-0000-4000-8000-000000000001",
        title: "Nyeri punggung bawah",
        caseStatus: "open",
        severity: "medium",
        summary: "Keluhan muncul setelah kelas Vinyasa Flow. Disarankan modifikasi pose.",
        openedOn: "2026-06-15",
      },
    ],
  },
};

const readyWithSpend = { status: "ready", detail: baseDetail } satisfies ClientDetailResult;

const readyWithoutSpend = {
  status: "ready",
  detail: { ...baseDetail, spend: null },
} satisfies ClientDetailResult;

const historyEmpty = {
  status: "ready",
  detail: { ...baseDetail, appointments: [] },
} satisfies ClientDetailResult;

const notesRestricted = {
  status: "ready",
  detail: { ...baseDetail, notes: { access: "restricted" } },
} satisfies ClientDetailResult;

const meta = {
  title: "Clients/ClientDetailView",
  component: ClientDetailView,
  args: {
    state: readyWithSpend,
  },
} satisfies Meta<typeof ClientDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    state: "loading",
  },
};

export const ReadyWithSpend: Story = {};

export const ReadyWithoutSpend: Story = {
  args: {
    state: readyWithoutSpend,
  },
};

export const HistoryEmpty: Story = {
  args: {
    state: historyEmpty,
    initialTab: 1,
  },
};

export const NotesRestricted: Story = {
  args: {
    state: notesRestricted,
    initialTab: 2,
  },
};

export const ErrorState: Story = {
  args: {
    state: { status: "error" },
  },
};
