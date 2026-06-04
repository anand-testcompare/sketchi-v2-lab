import type { DiagramScenario } from "./scenarios.js";

const FLOWCHART_IR_INSTRUCTIONS = [
  "Return only JSON. Do not wrap the JSON in markdown.",
  'Use type "flowchart".',
  'Every node must have id, label, and kind: "start", "process", "decision", or "end".',
  "Use exactly one start node and at least one end node.",
  "Every non-end node must have at least one outgoing edge.",
  "Every end node must have zero outgoing edges.",
  "Every decision node must have at least two outgoing edges.",
  "Every outgoing edge from a decision node must have a non-empty unique label.",
  "Edges must use existing node ids.",
  'Use layout { "direction": "TB", "edgeRouting": "orthogonal" } unless the prompt says otherwise.',
];

export function buildScenarioPrompt(scenario: DiagramScenario): string {
  return [
    "You are creating a Sketchi typed intermediate diagram.",
    "",
    "Scenario:",
    scenario.prompt,
    "",
    "Flowchart IR rules:",
    ...FLOWCHART_IR_INSTRUCTIONS.map((instruction) => `- ${instruction}`),
    "",
    "Expected JSON shape:",
    JSON.stringify(
      {
        id: "short-kebab-case-id",
        title: scenario.title,
        type: "flowchart",
        nodes: [
          { id: "start-id", label: "Human label", kind: "start" },
          { id: "decision-id", label: "Question?", kind: "decision" },
        ],
        edges: [
          {
            id: "edge-id",
            source: "decision-id",
            target: "target-id",
            label: "yes",
          },
        ],
        layout: { direction: "TB", edgeRouting: "orthogonal" },
        style: { accentColor: "#2563eb", backgroundColor: "#ffffff" },
      },
      null,
      2,
    ),
  ].join("\n");
}
