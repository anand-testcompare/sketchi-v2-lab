import type { Meta, StoryObj } from "@storybook/react-vite";

import { GenerationRunPanel } from "./generation-run-panel";

const meta = {
  title: "Diagram Studio/Components/GenerationRunPanel",
  component: GenerationRunPanel,
  args: {
    candidates: [
      {
        diagnostics: [],
        diagramValid: true,
        durationMs: 836,
        model: "gemini-3.1-flash-lite",
        provider: "cloudflare-google-ai-studio",
        text: '{"type":"flowchart"}',
        usage: { totalTokens: 681 },
      },
      {
        diagnostics: [],
        diagramValid: true,
        durationMs: 704,
        model: "google/gemini-3.1-flash-lite",
        provider: "cloudflare-workers-ai",
        text: '{"type":"flowchart"}',
        usage: { totalTokens: 622 },
      },
    ],
    title: "LLM comparison",
  },
} satisfies Meta<typeof GenerationRunPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
