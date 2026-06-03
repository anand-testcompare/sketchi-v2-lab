import { describe, expect, it } from "vitest";

import {
  flowchartFixture,
  pharmaBatchDispositionFlowchart,
} from "@sketchi/diagram-core";

import { renderIntermediateDiagram } from "./scene";

describe("renderIntermediateDiagram", () => {
  it("creates node, label, and edge scene elements", () => {
    const scene = renderIntermediateDiagram(flowchartFixture);

    expect(
      scene.elements.filter((element) => element.type === "node"),
    ).toHaveLength(flowchartFixture.nodes.length);
    expect(
      scene.elements.filter((element) => element.type === "text"),
    ).toHaveLength(flowchartFixture.nodes.length);
    expect(
      scene.elements.filter((element) => element.type === "arrow"),
    ).toHaveLength(flowchartFixture.edges.length);
  });

  it("renders deterministically for the same input", () => {
    expect(renderIntermediateDiagram(flowchartFixture)).toEqual(
      renderIntermediateDiagram(flowchartFixture),
    );
  });

  it("maps flowchart kinds to real scene shapes", () => {
    const scene = renderIntermediateDiagram(flowchartFixture);

    expect(
      scene.elements.find(
        (element) => element.type === "node" && element.nodeId === "prompt",
      ),
    ).toMatchObject({ shape: "ellipse" });
    expect(
      scene.elements.find(
        (element) => element.type === "node" && element.nodeId === "clear",
      ),
    ).toMatchObject({ shape: "diamond" });
  });

  it("wraps long labels into larger node boxes before real export", () => {
    const scene = renderIntermediateDiagram(pharmaBatchDispositionFlowchart);
    const qaReviewNode = scene.elements.find(
      (element) => element.type === "node" && element.nodeId === "qa-review",
    );

    expect(qaReviewNode).toMatchObject({
      type: "node",
      label: expect.stringContaining("\n"),
    });
    if (!qaReviewNode || qaReviewNode.type !== "node") {
      throw new Error("Expected qa-review to render as a node scene element.");
    }
    expect(qaReviewNode.height).toBeGreaterThan(72);
  });
});
