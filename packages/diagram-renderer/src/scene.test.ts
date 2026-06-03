import { describe, expect, it } from "vitest";

import { flowchartFixture } from "@sketchi/diagram-core";

import { renderIntermediateDiagram } from "./scene";

describe("renderIntermediateDiagram", () => {
  it("creates node, label, and edge scene elements", () => {
    const scene = renderIntermediateDiagram(flowchartFixture);

    expect(
      scene.elements.filter((element) => element.type === "rectangle"),
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
});
