import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  flowchartFixture,
  pharmaBatchDispositionFlowchart,
} from "@sketchi/diagram-core";

import { ExcalidrawWorkspace } from "./excalidraw-workspace";
import "../../styles/app.css";

const meta = {
  title: "Excalidraw/Components/ExcalidrawWorkspace",
  component: ExcalidrawWorkspace,
  args: {
    diagram: pharmaBatchDispositionFlowchart,
    status: "ready",
  },
  tags: ["test"],
} satisfies Meta<typeof ExcalidrawWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Draft: Story = {
  args: {
    diagram: flowchartFixture,
    status: "draft",
  },
};
