import { describe, expect, it } from "vitest";

import { parseIntermediateDiagram } from "../intermediate";
import { flowchartFixture, flowchartDiagramType } from "./flowchart";

describe("Flowchart diagram type", () => {
  it("has a typed fixture that satisfies the intermediate diagram contract", () => {
    expect(flowchartFixture.type).toBe(flowchartDiagramType);
    expect(parseIntermediateDiagram(flowchartFixture)).toEqual(
      flowchartFixture,
    );
  });
});
