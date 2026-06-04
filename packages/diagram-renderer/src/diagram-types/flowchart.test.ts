import { describe, expect, it } from "vitest";

import {
  flowchartFixture,
  pharmaBatchDispositionFlowchart,
} from "@sketchi/diagram-core";

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

  it("routes downward non-decision edges vertically before crossing ranks", () => {
    const scene = renderIntermediateDiagram(pharmaBatchDispositionFlowchart);
    const packagingArrow = scene.elements.find(
      (element) =>
        element.type === "arrow" && element.edgeId === "review-packaging",
    );

    expect(packagingArrow).toMatchObject({
      type: "arrow",
      points: [
        expect.objectContaining({ x: expect.any(Number) }),
        expect.objectContaining({ x: expect.any(Number) }),
        expect.objectContaining({ y: expect.any(Number) }),
        expect.objectContaining({ y: expect.any(Number) }),
      ],
    });

    if (packagingArrow?.type !== "arrow") {
      throw new Error("Expected review-packaging arrow.");
    }

    const start = packagingArrow.points[0];
    const firstBend = packagingArrow.points[1];
    const end = packagingArrow.points[3];

    if (!start || !firstBend || !end) {
      throw new Error("Expected an orthogonal review-packaging route.");
    }

    expect(start.x).toBe(firstBend.x);
    expect(end.y).toBeGreaterThan(start.y);
  });
});
