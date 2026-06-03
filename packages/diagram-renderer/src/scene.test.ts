import { describe, expect, it } from "vitest";

import { onboardingFlowFixture } from "@sketchi/diagram-core";

import { renderIntermediateDiagram } from "./scene";

describe("renderIntermediateDiagram", () => {
  it("creates node, label, and edge scene elements", () => {
    const scene = renderIntermediateDiagram(onboardingFlowFixture);

    expect(scene.elements.filter((element) => element.type === "rectangle"))
      .toHaveLength(onboardingFlowFixture.nodes.length);
    expect(scene.elements.filter((element) => element.type === "text"))
      .toHaveLength(onboardingFlowFixture.nodes.length);
    expect(scene.elements.filter((element) => element.type === "arrow"))
      .toHaveLength(onboardingFlowFixture.edges.length);
  });

  it("renders deterministically for the same input", () => {
    expect(renderIntermediateDiagram(onboardingFlowFixture)).toEqual(
      renderIntermediateDiagram(onboardingFlowFixture)
    );
  });
});
