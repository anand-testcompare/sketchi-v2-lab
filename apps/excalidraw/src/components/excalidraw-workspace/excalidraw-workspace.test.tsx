import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@sketchi/diagram-studio-ui", () => ({
  ExcalidrawSceneCanvas: ({ title }: { title: string }) => (
    <section aria-label={title} data-testid="mock-excalidraw-canvas" />
  ),
}));

import { flowchartFixture } from "@sketchi/diagram-core";

import { ExcalidrawWorkspace } from "./excalidraw-workspace";

describe("ExcalidrawWorkspace", () => {
  it("renders the app shell around a generated scene", () => {
    render(<ExcalidrawWorkspace diagram={flowchartFixture} status="draft" />);

    expect(
      screen.getByRole("heading", { name: "Sketchi onboarding decision flow" }),
    ).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByLabelText("5 nodes")).toBeTruthy();
    expect(screen.getByText("Nodes")).toBeTruthy();
    expect(screen.getByTestId("mock-excalidraw-canvas")).toBeTruthy();
  });
});
