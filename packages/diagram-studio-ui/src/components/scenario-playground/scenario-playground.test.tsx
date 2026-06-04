import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@excalidraw/excalidraw", () => ({
  Excalidraw: () => <div data-testid="mock-excalidraw">Mock Excalidraw</div>,
}));

import { ScenarioPlayground } from "./scenario-playground";

describe("ScenarioPlayground", () => {
  it("renders maintained scenarios and their checks", () => {
    render(<ScenarioPlayground />);

    expect(
      screen.getByRole("heading", { name: "Sketchi diagram scenarios" })
    ).toBeTruthy();
    expect(screen.getByText("Expected at least 5 nodes.")).toBeTruthy();
    expect(screen.getByText("Loading Excalidraw")).toBeTruthy();
  });

  it("reports invalid candidate output", () => {
    render(<ScenarioPlayground />);

    fireEvent.change(screen.getByLabelText("Candidate IR"), {
      target: { value: "not json" }
    });

    expect(
      screen.getByText("Model output did not contain a JSON object.")
    ).toBeTruthy();
  });
});
