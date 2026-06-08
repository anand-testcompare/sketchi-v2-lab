import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@sketchi/diagram-studio-ui", () => ({
  ExcalidrawSceneCanvas: ({ title }: { title: string }) => (
    <section aria-label={title} data-testid="mock-excalidraw-canvas" />
  ),
}));

import {
  flowchartFixture,
  mindmapFixture,
  pharmaBatchDispositionFlowchart,
} from "@sketchi/diagram-core";

import { ExcalidrawWorkspace } from "./excalidraw-workspace";

describe("ExcalidrawWorkspace", () => {
  it("renders the active scene and switches diagrams", () => {
    render(
      <ExcalidrawWorkspace
        diagrams={[
          pharmaBatchDispositionFlowchart,
          flowchartFixture,
          mindmapFixture,
        ]}
      />,
    );

    expect(
      screen.getByLabelText("Pharma batch disposition flow canvas"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Sketchi mindmap fixture/ }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Sketchi onboarding decision flow/ }),
    );
    expect(
      screen.getByLabelText("Sketchi onboarding decision flow canvas"),
    ).toBeTruthy();
  });

  it("renders an empty state without diagrams", () => {
    render(<ExcalidrawWorkspace diagrams={[]} />);

    expect(screen.getByText("No diagram selected")).toBeTruthy();
  });
});
