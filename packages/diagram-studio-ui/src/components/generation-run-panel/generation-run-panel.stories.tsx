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
    ],
    title: "LLM run",
  },
} satisfies Meta<typeof GenerationRunPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
