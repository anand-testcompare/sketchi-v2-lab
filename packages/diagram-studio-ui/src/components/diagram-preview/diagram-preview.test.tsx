import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { flowchartFixture } from "@sketchi/diagram-core";
import { renderIntermediateDiagram } from "@sketchi/diagram-renderer";

import { DiagramPreview } from "./diagram-preview";

describe("DiagramPreview", () => {
  it("renders an accessible diagram image", () => {
    const scene = renderIntermediateDiagram(flowchartFixture);

    render(<DiagramPreview scene={scene} />);

    expect(
      screen.getByRole("img", { name: "Sketchi onboarding flow" }),
    ).toBeTruthy();
  });
});
