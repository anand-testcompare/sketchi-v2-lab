import { describe, expect, it } from "vitest";

import { flowchartFixture } from "@sketchi/diagram-core";

import { renderIntermediateDiagram } from "../scene";

describe("Flowchart renderer contract", () => {
  it("renders the generated fixture into deterministic scene elements", () => {
    const scene = renderIntermediateDiagram(flowchartFixture);

    expect(scene.diagramId).toBe("onboarding-flow");
    expect(
      scene.elements.filter((element) => element.type === "node"),
    ).toHaveLength(flowchartFixture.nodes.length);
    expect(
      scene.elements.filter((element) => element.type === "arrow"),
    ).toHaveLength(flowchartFixture.edges.length);
  });
});
