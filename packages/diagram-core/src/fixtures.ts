import { flowchartFixture } from "./diagram-types/flowchart";
import { mindmapFixture } from "./diagram-types/mindmap";
import { parseIntermediateDiagram } from "./intermediate";

export const diagramFixtures = [
  parseIntermediateDiagram(flowchartFixture),
  parseIntermediateDiagram(mindmapFixture),
];
