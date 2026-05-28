import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataTable } from "@/components/hom/data-table";

const meta = {
  title: "HOM/DataTable",
  component: DataTable,
  args: {
    columns: ["Time", "Client", "Service", "Status"],
    rows: [
      { Time: "09:00", Client: "Nadia A.", Service: "Clinical Pilates", Status: "confirmed" },
      { Time: "10:30", Client: "Bima R.", Service: "Posture Assessment", Status: "scheduled" },
      { Time: "13:00", Client: "Clara S.", Service: "Private Session", Status: "reschedule_requested" },
    ],
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    rows: [],
    emptyTitle: "No appointments match this filter",
  },
};
