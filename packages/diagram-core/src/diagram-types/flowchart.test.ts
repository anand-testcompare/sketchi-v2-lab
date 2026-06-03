import { describe, expect, it } from "vitest";

import { DiagramValidationError } from "../intermediate";
import {
  flowchartDiagramType,
  flowchartEvaluationFixtures,
  flowchartFixture,
  parseFlowchartDiagram,
  pharmaBatchDispositionFlowchart,
} from "./flowchart";

describe("parseFlowchartDiagram", () => {
  it("has a typed fixture that satisfies the flowchart contract", () => {
    expect(flowchartFixture.type).toBe(flowchartDiagramType);
    expect(parseFlowchartDiagram(flowchartFixture)).toEqual(flowchartFixture);
  });

  it("keeps canonical flowchart eval fixtures valid", () => {
    expect(flowchartEvaluationFixtures).toContain(
      pharmaBatchDispositionFlowchart,
    );
    expect(flowchartEvaluationFixtures.map((fixture) => fixture.id)).toEqual([
      "onboarding-flow",
      "pharma-batch-disposition",
    ]);
  });

  it("rejects decision branches without labels", () => {
    expect(() =>
      parseFlowchartDiagram({
        ...flowchartFixture,
        edges: flowchartFixture.edges.map((edge) =>
          edge.id === "clear-draft" ? { ...edge, label: undefined } : edge,
        ),
      }),
    ).toThrow(DiagramValidationError);
  });

  it("rejects unreachable non-start nodes", () => {
    expect(() =>
      parseFlowchartDiagram({
        ...flowchartFixture,
        nodes: [
          ...flowchartFixture.nodes,
          { id: "orphan", label: "Orphan process", kind: "process" },
        ],
      }),
    ).toThrow('Node "orphan" must be reachable from another node.');
  });
});
