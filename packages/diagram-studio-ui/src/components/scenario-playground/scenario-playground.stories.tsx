import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScenarioPlayground } from "./scenario-playground";

const meta = {
  title: "Diagram Studio/Components/ScenarioPlayground",
  component: ScenarioPlayground
} satisfies Meta<typeof ScenarioPlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PharmaBatchDisposition: Story = {
  args: {
    initialScenarioId: "pharma-batch-disposition"
  }
};
