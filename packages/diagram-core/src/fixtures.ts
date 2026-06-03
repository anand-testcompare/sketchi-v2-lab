import { parseIntermediateDiagram } from "./intermediate";
import { flowchartFixture } from "./diagram-types/flowchart";

export const architectureFixture = parseIntermediateDiagram({
  id: "architecture-boundaries",
  title: "Diagram generation boundaries",
  type: "architecture",
  nodes: [
    { id: "mcp", label: "Generic MCP" },
    { id: "core", label: "Diagram core" },
    { id: "renderer", label: "Renderer" },
    { id: "ui", label: "Studio UI" },
  ],
  edges: [
    { id: "mcp-core", source: "mcp", target: "core" },
    { id: "core-renderer", source: "core", target: "renderer" },
    { id: "renderer-ui", source: "renderer", target: "ui" },
  ],
  layout: {
    direction: "TB",
    edgeRouting: "orthogonal",
  },
  style: {
    accentColor: "#047857",
    backgroundColor: "#f8fafc",
  },
});

export const diagramFixtures = [flowchartFixture, architectureFixture];
