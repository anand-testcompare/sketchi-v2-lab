import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@excalidraw/excalidraw", () => ({
  Excalidraw: () => <div data-testid="mock-excalidraw">Mock Excalidraw</div>,
}));

import { convertSceneToExcalidraw } from "@sketchi/diagram-excalidraw";
import { flowchartFixture } from "@sketchi/diagram-core";
import { renderIntermediateDiagram } from "@sketchi/diagram-renderer";

import { ExcalidrawSceneCanvas } from "./excalidraw-scene-canvas";

describe("ExcalidrawSceneCanvas", () => {
  it("renders a client-only Excalidraw shell", () => {
    const scene = convertSceneToExcalidraw(
      renderIntermediateDiagram(flowchartFixture),
    );

    render(
      <ExcalidrawSceneCanvas
        scene={scene}
        title="Sketchi onboarding decision flow"
      />,
    );

    expect(
      screen
        .getByTestId("excalidraw-scene-canvas")
        .getAttribute("aria-label"),
    ).toBe("Sketchi onboarding decision flow");
    expect(screen.getByText("Loading Excalidraw")).toBeTruthy();
  });
});
