import { describe, expect, it } from "vitest";

import {
  DiagramValidationError,
  onboardingFlowFixture,
  parseIntermediateDiagram
} from "./index";

describe("parseIntermediateDiagram", () => {
  it("accepts a valid diagram fixture", () => {
    expect(parseIntermediateDiagram(onboardingFlowFixture)).toMatchObject({
      id: "onboarding-flow",
      nodes: expect.arrayContaining([
        expect.objectContaining({ id: "prompt" })
      ])
    });
  });

  it("rejects duplicate node ids", () => {
    expect(() =>
      parseIntermediateDiagram({
        ...onboardingFlowFixture,
        nodes: [
          ...onboardingFlowFixture.nodes,
          { id: "prompt", label: "Duplicate" }
        ]
      })
    ).toThrow(DiagramValidationError);
  });

  it("rejects edges that reference missing nodes", () => {
    expect(() =>
      parseIntermediateDiagram({
        ...onboardingFlowFixture,
        edges: [
          ...onboardingFlowFixture.edges,
          {
            id: "missing-edge",
            source: "prompt",
            target: "missing",
            label: "bad"
          }
        ]
      })
    ).toThrow('Edge "missing-edge" references missing target node "missing".');
  });
});
