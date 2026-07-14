import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KnowledgeStudioPage } from "./knowledge-studio-page";
import type { KnowledgeStudioPageState } from "./knowledge-studio-page-state";

const readyState = {
  status: "ready",
  source: "supabase",
  sources: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      title: "Pricing Sheet 2026",
      docType: "pricing",
      scopes: "public_chatbot",
      status: "published",
      version: 1,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      title: "Cancellation SOP",
      docType: "sop",
      scopes: "internal_admin",
      status: "extracted",
      version: 1,
    },
  ],
} satisfies KnowledgeStudioPageState;

const meta = {
  title: "KnowledgeStudio/KnowledgeStudioPage",
  component: KnowledgeStudioPage,
  args: {
    state: readyState,
    uploadSlot: <div>Upload form</div>,
    testLabSlot: <div>Test Lab form</div>,
  },
} satisfies Meta<typeof KnowledgeStudioPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Empty: Story = {
  args: {
    state: {
      status: "empty",
      source: "supabase",
    },
  },
};

export const PermissionDenied: Story = {
  args: {
    state: {
      status: "permission_denied",
      source: "supabase",
    },
  },
};

export const ConfigurationError: Story = {
  args: {
    state: {
      status: "configuration_error",
      source: "mock",
    },
  },
};

export const GenericError: Story = {
  args: {
    state: {
      status: "error",
      source: "supabase",
      message: "Gagal memuat sumber pengetahuan.",
    },
  },
};
