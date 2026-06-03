import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { flowchartFixture } from "@sketchi/diagram-core";

import { GenerationWorkspace } from "./generation-workspace";

describe("GenerationWorkspace", () => {
  it("renders the diagram title and health metadata", () => {
    render(<GenerationWorkspace diagram={flowchartFixture} />);

    expect(
      screen.getByRole("heading", { name: "Sketchi onboarding decision flow" }),
    ).toBeTruthy();
    expect(screen.getByText("5 nodes")).toBeTruthy();
    expect(screen.getByText("5 edges")).toBeTruthy();
    expect(screen.getByText("Validated flowchart IR")).toBeTruthy();
    expect(screen.getByText("All arrows are bound")).toBeTruthy();
  });
});
