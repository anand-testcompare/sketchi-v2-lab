import { parseIntermediateDiagram } from "../intermediate";

export const flowchartDiagramType = "flowchart" as const;

export const flowchartFixture = parseIntermediateDiagram({
  id: "onboarding-flow",
  title: "Sketchi onboarding flow",
  type: flowchartDiagramType,
  nodes: [
    { id: "prompt", label: "Prompt" },
    { id: "plan", label: "Plan" },
    { id: "draft", label: "Draft diagram" },
    { id: "review", label: "Review" },
  ],
  edges: [
    { id: "prompt-plan", source: "prompt", target: "plan", label: "shape" },
    { id: "plan-draft", source: "plan", target: "draft", label: "render" },
    {
      id: "draft-review",
      source: "draft",
      target: "review",
      label: "inspect",
    },
  ],
  layout: {
    direction: "LR",
    edgeRouting: "orthogonal",
  },
  style: {
    accentColor: "#2563eb",
    backgroundColor: "#ffffff",
  },
});
