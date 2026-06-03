import { describe, expect, it } from "vitest";

import { parseIntermediateDiagram } from "../intermediate";
import { mindmapFixture, mindmapDiagramType } from "./mindmap";

describe("Mindmap diagram type", () => {
  it("has a typed fixture that satisfies the intermediate diagram contract", () => {
    expect(mindmapFixture.type).toBe(mindmapDiagramType);
    expect(parseIntermediateDiagram(mindmapFixture)).toEqual(mindmapFixture);
  });
});
