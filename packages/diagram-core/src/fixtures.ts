import { parseIntermediateDiagram } from "./intermediate";

export const onboardingFlowFixture = parseIntermediateDiagram({
  id: "onboarding-flow",
  title: "Sketchi onboarding flow",
  type: "flowchart",
  nodes: [
    { id: "prompt", label: "Prompt" },
    { id: "plan", label: "Plan" },
    { id: "draft", label: "Draft diagram" },
    { id: "review", label: "Review" }
  ],
  edges: [
    { id: "prompt-plan", source: "prompt", target: "plan", label: "shape" },
    { id: "plan-draft", source: "plan", target: "draft", label: "render" },
    {
      id: "draft-review",
      source: "draft",
      target: "review",
      label: "inspect"
    }
  ],
  layout: {
    direction: "LR",
    edgeRouting: "orthogonal"
  },
  style: {
    accentColor: "#2563eb",
    backgroundColor: "#ffffff"
  }
});

export const architectureFixture = parseIntermediateDiagram({
  id: "architecture-boundaries",
  title: "Diagram generation boundaries",
  type: "architecture",
  nodes: [
    { id: "mcp", label: "Generic MCP" },
    { id: "core", label: "Diagram core" },
    { id: "renderer", label: "Renderer" },
    { id: "ui", label: "Studio UI" }
  ],
  edges: [
    { id: "mcp-core", source: "mcp", target: "core" },
    { id: "core-renderer", source: "core", target: "renderer" },
    { id: "renderer-ui", source: "renderer", target: "ui" }
  ],
  layout: {
    direction: "TB",
    edgeRouting: "orthogonal"
  },
  style: {
    accentColor: "#047857",
    backgroundColor: "#f8fafc"
  }
});

export const diagramFixtures = [onboardingFlowFixture, architectureFixture];
