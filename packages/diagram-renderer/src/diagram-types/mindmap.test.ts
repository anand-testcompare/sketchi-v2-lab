import { describe, expect, it } from "vitest";

import { mindmapFixture } from "@sketchi/diagram-core";

import { renderIntermediateDiagram } from "../scene";

describe("Mindmap renderer contract", () => {
  it("renders the generated fixture into deterministic scene elements", () => {
    const scene = renderIntermediateDiagram(mindmapFixture);

    expect(scene.diagramId).toBe("mindmap-example");
    expect(scene.elements.filter((element) => element.type === "node"))
      .toHaveLength(mindmapFixture.nodes.length);
    expect(scene.elements.filter((element) => element.type === "arrow"))
      .toHaveLength(mindmapFixture.edges.length);
  });
});
