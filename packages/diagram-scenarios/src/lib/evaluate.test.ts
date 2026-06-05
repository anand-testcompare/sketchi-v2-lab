import { describe, expect, it } from "vitest";

import {
  evaluateScenarioDiagram,
  evaluateScenarioFixture,
  evaluateScenarioOutput,
  extractJsonCandidate,
} from "./evaluate";
import { flowchartScenarios, getScenario } from "./scenarios";

const onboardingScenario = getScenario("sketchi-onboarding-decision-flow");

describe("diagram scenario evaluation", () => {
  it("passes maintained fixture diagrams through the deterministic pipeline", () => {
    const result = evaluateScenarioFixture(onboardingScenario);

    expect(result.ok).toBe(true);
    expect(result.excalidrawValidation.ok).toBe(true);
    expect(
      result.excalidrawScene.elements.some(
        (element) => element.type === "arrow",
      ),
    ).toBe(true);
  });

  it("passes every maintained scenario through the deterministic pipeline", () => {
    expect(flowchartScenarios.length).toBeGreaterThanOrEqual(20);

    for (const scenario of flowchartScenarios) {
      const result = evaluateScenarioFixture(scenario);

      expect(
        result.ok,
        `${scenario.id}: ${result.checks
          .filter((check) => !check.passed)
          .map((check) => check.message)
          .join(", ")}`,
      ).toBe(true);
      expect(
        result.excalidrawValidation.ok,
        `${scenario.id}: ${result.excalidrawValidation.issues
          .map((issue) => issue.message)
          .join(", ")}`,
      ).toBe(true);
    }
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
