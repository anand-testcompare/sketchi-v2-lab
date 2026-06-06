import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import { IconLibrary, type IconLibraryData } from "./icon-library";
import "../../styles/app.css";

const fixtureData: IconLibraryData = {
  generatedAt: "2026-06-06T16:05:35.422Z",
  summary: {
    collectionCounts: {
      "ai-apps-agents": 2,
      "auth-identity": 1,
      "frontend-frameworks": 1,
    },
    flagCounts: {
      "duplicate-raster": 1,
    },
    totalIcons: 4,
  },
  icons: [
    {
      bytes: 1802,
      collection: "ai-apps-agents",
      fileName: "codex.svg",
      flags: [],
      id: "ai-apps-agents:codex",
      slug: "codex",
      urlPath: "/output/upload-ready/svg/ai-apps-agents/codex.svg",
    },
    {
      bytes: 714,
      collection: "ai-apps-agents",
      fileName: "akashchat.svg",
      flags: [],
      id: "ai-apps-agents:akashchat",
      slug: "akashchat",
      urlPath: "/output/upload-ready/svg/ai-apps-agents/akashchat.svg",
    },
    {
      bytes: 1901,
      collection: "auth-identity",
      fileName: "workos.svg",
      flags: ["duplicate-raster"],
      id: "auth-identity:workos",
      slug: "workos",
      urlPath: "/output/upload-ready/svg/auth-identity/workos.svg",
    },
    {
      bytes: 1420,
      collection: "frontend-frameworks",
      fileName: "react.svg",
      flags: [],
      id: "frontend-frameworks:react",
      slug: "react",
      urlPath: "/output/upload-ready/svg/frontend-frameworks/react.svg",
    },
  ],
};

const meta = {
  title: "Icons/Components/IconLibrary",
  component: IconLibrary,
  args: {
    data: fixtureData,
    status: "ready",
  },
  tags: ["test"],
} satisfies Meta<typeof IconLibrary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FilteredSearch: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText("Search icons"), "workos");
    await expect(canvas.getByText("workos")).toBeDefined();
    await expect(canvas.queryByText("codex")).toBeNull();
  },
};

export const Loading: Story = {
  args: {
    status: "loading",
  },
};

export const ErrorState: Story = {
  args: {
    errorMessage: "review-data.json is missing",
    status: "error",
  },
};
