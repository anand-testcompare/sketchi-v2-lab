import type { Meta, StoryObj } from "@storybook/react-vite";

import { architectureFixture, onboardingFlowFixture } from "@sketchi/diagram-core";

import { GenerationWorkspace } from "./generation-workspace";
import "./styles.css";

const meta = {
  title: "Diagram Studio/Generation Workspace",
  component: GenerationWorkspace,
  args: {
    diagram: onboardingFlowFixture,
    status: "ready"
  }
} satisfies Meta<typeof GenerationWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Generating: Story = {
  args: {
    status: "generating"
  }
};

export const Architecture: Story = {
  args: {
    diagram: architectureFixture
  }
};
