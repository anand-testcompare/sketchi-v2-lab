import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SurfaceCard } from "./surface-card";

describe("SurfaceCard", () => {
  it("renders the surface details and links out", () => {
    render(
      <SurfaceCard
        cta="Open workspace"
        desc="The no-auth diagram workspace."
        domain="excalidraw.sketchi.app"
        href="https://excalidraw.sketchi.app"
        name="Excalidraw workspace"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Excalidraw workspace" }),
    ).toBeTruthy();
    expect(screen.getByText("excalidraw.sketchi.app")).toBeTruthy();
    expect(screen.getByText("No-auth preview")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "https://excalidraw.sketchi.app",
    );
  });

  it("shows a live status when requested", () => {
    render(
      <SurfaceCard
        desc="Docs"
        domain="sketchi.app/docs"
        href="/docs"
        name="Documentation"
        status="live"
      />,
    );

    expect(screen.getByText("Live")).toBeTruthy();
  });
});
