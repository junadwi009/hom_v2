import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KnowledgeUploadPanel } from "./knowledge-upload-panel";

const meta = {
  title: "KnowledgeStudio/KnowledgeUploadPanel",
  component: KnowledgeUploadPanel,
} satisfies Meta<typeof KnowledgeUploadPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
