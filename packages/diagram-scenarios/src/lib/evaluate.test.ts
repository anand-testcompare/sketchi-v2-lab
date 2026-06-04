import { describe, expect, it } from "vitest";

import {
  evaluateScenarioDiagram,
  evaluateScenarioFixture,
  evaluateScenarioOutput,
  extractJsonCandidate,
} from "./evaluate";
import { getScenario } from "./scenarios";

const onboardingScenario = getScenario("sketchi-onboarding-decision-flow");

describe("diagram scenario evaluation", () => {
  it("passes maintained fixture diagrams through the deterministic pipeline", () => {
    const result = evaluateScenarioFixture(onboardingScenario);

    expect(result.ok).toBe(true);
    expect(result.excalidrawValidation.ok).toBe(true);
    expect(result.excalidrawScene.elements.some((element) => element.type === "arrow")).toBe(true);
  });

  it("extracts a JSON object from wrapped model output", () => {
    const output = `Here is the JSON:\n${JSON.stringify(onboardingScenario.expectedDiagram)}`;

    expect(extractJsonCandidate(output)).toMatchObject({
      id: onboardingScenario.expectedDiagram.id,
      type: "flowchart",
    });
    expect(evaluateScenarioOutput(onboardingScenario, output).ok).toBe(true);
  });

  it("fails semantic checks when required branches are missing", () => {
    const candidate = {
      ...onboardingScenario.expectedDiagram,
      edges: onboardingScenario.expectedDiagram.edges.map((edge) =>
        edge.id === "clear-review" ? { ...edge, label: "maybe" } : edge,
      ),
    };

    const result = evaluateScenarioDiagram(onboardingScenario, candidate);

    expect(result.ok).toBe(false);
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: "branch-label:no",
        passed: false,
      }),
    );
  });
});
