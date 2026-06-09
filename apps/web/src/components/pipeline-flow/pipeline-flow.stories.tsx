import type { Meta, StoryObj } from "@storybook/react-vite";

import { PipelineFlow } from "./pipeline-flow";
import "../../styles/app.css";

const meta = {
  title: "Web/Components/PipelineFlow",
  component: PipelineFlow,
  tags: ["test"],
} satisfies Meta<typeof PipelineFlow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
