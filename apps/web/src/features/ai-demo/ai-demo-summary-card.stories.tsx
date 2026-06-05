import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiDemoSummaryCard } from "./ai-demo-summary-card";

const meta = {
  title: "AiDemo/AiDemoSummaryCard",
  component: AiDemoSummaryCard,
  args: {
    enabled: true,
    canView: true,
  },
} satisfies Meta<typeof AiDemoSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Loading: Story = {
  args: {
    previewSubmitting: true,
  },
};

export const Success: Story = {
  args: {
    previewState: {
      status: "success",
      model: "openai/gpt-4.1-mini",
      summary: {
        summaryTitle: "Ringkasan Operasional Demo",
        appointmentSummary:
          "Ada 2 jadwal aktif, 1 sesi selesai, 1 dibatalkan, dan 1 tidak hadir.",
        packageSummary:
          "2 paket aktif dengan total 14 sesi tersisa; tidak ada paket bersaldo rendah.",
        paymentSummary:
          "2 pembayaran lunas, 1 menunggu, dan 1 dibatalkan pada periode demo ini.",
        recommendedFollowUps: [
          "Tindak lanjuti 1 pembayaran yang masih menunggu.",
          "Konfirmasi ulang jadwal yang akan datang.",
        ],
        riskNotes: ["Tingkat ketidakhadiran perlu dipantau pada data nyata."],
        demoDisclaimer:
          "Ringkasan operasional demo, bukan nasihat finansial, hukum, atau medis resmi.",
      },
    },
  },
};

export const Unavailable: Story = {
  args: {
    previewState: {
      status: "unavailable",
      message: "AI demo unavailable",
    },
  },
};

export const Disabled: Story = {
  args: {
    enabled: false,
  },
};

export const NoPermission: Story = {
  args: {
    enabled: true,
    canView: false,
  },
};
