import {
  type FlowchartDiagram,
  type FlowchartNodeKind,
  flowchartFixture,
  pharmaBatchDispositionFlowchart,
} from "@sketchi/diagram-core";

export interface FlowchartScenarioAssertions {
  minEdgeCount: number;
  minNodeCount: number;
  requiredBranchLabels: string[];
  requiredNodeKinds: FlowchartNodeKind[];
  requiredNodeLabels: string[];
}

export interface DiagramScenario {
  assertions: FlowchartScenarioAssertions;
  description: string;
  diagramType: "flowchart";
  expectedDiagram: FlowchartDiagram;
  id: string;
  prompt: string;
  title: string;
}

export const flowchartScenarios = [
  {
    id: "sketchi-onboarding-decision-flow",
    title: "Sketchi onboarding decision flow",
    diagramType: "flowchart",
    description:
      "A compact decision flow that exercises start/process/decision/end semantics and yes/no branch labels.",
    prompt:
      "Create a flowchart for a Sketchi diagram request. The flow starts when a prompt is received, extracts requirements, asks whether the scope is clear, drafts typed IR when clear, and otherwise moves to review. End at review.",
    expectedDiagram: flowchartFixture,
    assertions: {
      minNodeCount: 5,
      minEdgeCount: 5,
      requiredNodeKinds: ["start", "process", "decision", "end"],
      requiredNodeLabels: [
        "Prompt received",
        "Extract requirements",
        "Scope clear?",
        "Draft typed IR",
        "Review diagram",
      ],
      requiredBranchLabels: ["yes", "no"],
    },
  },
  {
    id: "pharma-batch-disposition",
    title: "Pharma batch disposition",
    diagramType: "flowchart",
    description:
      "A decision-heavy regulated workflow with multi-way branches and a loop back into final review.",
    prompt:
      "Create a flowchart for pharma batch disposition. A batch is received, QA reviews the Certificate of Analysis, and then decides whether it passes specs. Passing goes to QA Manager final review and packaging. Retest goes through investigation and returns to final review. Reject ends at reject batch.",
    expectedDiagram: pharmaBatchDispositionFlowchart,
    assertions: {
      minNodeCount: 7,
      minEdgeCount: 7,
      requiredNodeKinds: ["start", "process", "decision", "end"],
      requiredNodeLabels: [
        "Batch received",
        "QA reviews Certificate of Analysis",
        "Passes specs?",
        "QA Manager final review",
        "Send to packaging",
        "Investigate retesting",
        "Reject batch",
      ],
      requiredBranchLabels: ["yes", "retest", "reject"],
    },
  },
] satisfies DiagramScenario[];

export type FlowchartScenarioId = (typeof flowchartScenarios)[number]["id"];

export function getScenario(id: string): DiagramScenario {
  const scenario = flowchartScenarios.find((candidate) => candidate.id === id);

  if (!scenario) {
    throw new Error(`Unknown scenario "${id}".`);
  }

  return scenario;
}
