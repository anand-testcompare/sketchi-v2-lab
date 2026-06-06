import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IconLibrary, type IconLibraryData } from "./icon-library";

const fixtureData: IconLibraryData = {
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
      bytes: 1901,
      collection: "auth-identity",
      fileName: "workos.svg",
      flags: ["duplicate-raster"],
      id: "auth-identity:workos",
      slug: "workos",
      urlPath: "/output/upload-ready/svg/auth-identity/workos.svg",
    },
  ],
  summary: {
    collectionCounts: {
      "ai-apps-agents": 1,
      "auth-identity": 1,
    },
    flagCounts: {
      "duplicate-raster": 1,
    },
    totalIcons: 2,
  },
};

describe("IconLibrary", () => {
  it("renders icon output summary and filters by query", () => {
    render(<IconLibrary data={fixtureData} />);

    expect(
      screen.getByRole("heading", { name: "Curated icon output" }),
    ).toBeTruthy();
    expect(screen.getByText("2 icons")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search icons"), {
      target: { value: "workos" },
    });

    expect(screen.getByText("workos")).toBeTruthy();
    expect(screen.queryByText("codex")).toBeNull();
  });

  it("shows a loading state", () => {
    render(<IconLibrary status="loading" />);

    expect(screen.getByRole("status").textContent).toContain(
      "Loading icon output",
    );
  });
});
