import type { Meta, StoryObj } from "@storybook/react-vite";

import { SurfaceCard } from "./surface-card";
import "../../styles/app.css";

const meta = {
  title: "Web/Components/SurfaceCard",
  component: SurfaceCard,
  args: {
    cta: "Open workspace",
    desc: "The no-auth diagram workspace. Inspect the IR, scene, and a real Excalidraw canvas side by side.",
    domain: "excalidraw.sketchi.app",
    href: "https://excalidraw.sketchi.app",
    name: "Excalidraw workspace",
    status: "preview",
  },
  tags: ["test"],
} satisfies Meta<typeof SurfaceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Live: Story = {
  args: {
    cta: "Open docs",
    desc: "How the pipeline, diagram types, no-auth status, and deploys fit together.",
    domain: "sketchi.app/docs",
    href: "/docs",
    name: "Documentation",
    status: "live",
  },
};
