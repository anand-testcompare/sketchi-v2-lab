import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { onboardingFlowFixture } from "@sketchi/diagram-core";

import { GenerationWorkspace } from "./generation-workspace";

describe("GenerationWorkspace", () => {
  it("renders the diagram title and health metadata", () => {
    render(<GenerationWorkspace diagram={onboardingFlowFixture} />);

    expect(screen.getByRole("heading", { name: "Sketchi onboarding flow" }))
      .toBeTruthy();
    expect(screen.getByText("4 nodes")).toBeTruthy();
    expect(screen.getByText("3 edges")).toBeTruthy();
    expect(screen.getByText("Validated diagram IR")).toBeTruthy();
  });
});
