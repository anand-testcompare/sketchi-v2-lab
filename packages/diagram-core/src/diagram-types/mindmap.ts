import { parseIntermediateDiagram } from "../intermediate.js";

export const mindmapDiagramType = "mindmap" as const;

export const mindmapFixture = parseIntermediateDiagram({
  id: "mindmap-example",
  title: "Sketchi mindmap fixture",
  type: mindmapDiagramType,
  nodes: [
    { id: "root", label: "Mindmap" },
    { id: "first-branch", label: "First branch" },
    { id: "second-branch", label: "Second branch" }
  ],
  edges: [
    {
      id: "root-first-branch",
      source: "root",
      target: "first-branch",
      label: "expands"
    },
    {
      id: "root-second-branch",
      source: "root",
      target: "second-branch",
      label: "connects"
    }
  ],
  layout: {
    direction: "LR",
    edgeRouting: "orthogonal"
  },
  style: {
    accentColor: "#7c3aed",
    backgroundColor: "#ffffff"
  }
});
