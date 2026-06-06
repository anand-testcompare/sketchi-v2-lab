import { z } from "zod";

import {
  DiagramEdgeSchema,
  DiagramNodeSchema,
  DiagramValidationError,
  IntermediateDiagramSchema,
  validateIntermediateDiagram,
} from "../intermediate.js";

export const flowchartDiagramType = "flowchart" as const;

export const FlowchartNodeKindSchema = z.enum([
  "start",
  "process",
  "decision",
  "end",
]);

export const FlowchartNodeSchema = DiagramNodeSchema.extend({
  kind: FlowchartNodeKindSchema,
  description: z.string().min(1).optional(),
});

export const FlowchartEdgeSchema = DiagramEdgeSchema.extend({
  label: z.string().min(1).optional(),
});

export const FlowchartDiagramSchema = IntermediateDiagramSchema.extend({
  type: z.literal(flowchartDiagramType),
  nodes: z.array(FlowchartNodeSchema).min(2),
  edges: z.array(FlowchartEdgeSchema).min(1),
});

export type FlowchartNodeKind = z.infer<typeof FlowchartNodeKindSchema>;
export type FlowchartNode = z.infer<typeof FlowchartNodeSchema>;
export type FlowchartEdge = z.infer<typeof FlowchartEdgeSchema>;
export type FlowchartDiagram = z.infer<typeof FlowchartDiagramSchema>;

function edgeBuckets(edges: readonly FlowchartEdge[]) {
  const incoming = new Map<string, FlowchartEdge[]>();
  const outgoing = new Map<string, FlowchartEdge[]>();

  for (const edge of edges) {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }

  return { incoming, outgoing };
}

function requireFlowchartInvariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new DiagramValidationError(message);
  }
}

function validateDecisionBranches(
  node: FlowchartNode,
  outgoingEdges: readonly FlowchartEdge[],
): void {
  requireFlowchartInvariant(
    outgoingEdges.length >= 2,
    `Decision node "${node.id}" must have at least two outgoing branches.`,
  );

  const labels = outgoingEdges.map((edge) => edge.label?.trim() ?? "");
  requireFlowchartInvariant(
    labels.every((label) => label.length > 0),
    `Decision node "${node.id}" must label every outgoing branch.`,
  );

  const uniqueLabels = new Set(labels.map((label) => label.toLowerCase()));
  requireFlowchartInvariant(
    uniqueLabels.size === labels.length,
    `Decision node "${node.id}" must use unique branch labels.`,
  );
}

export function validateFlowchartDiagram(
  diagram: FlowchartDiagram,
): FlowchartDiagram {
  validateIntermediateDiagram(diagram);

  const startNodes = diagram.nodes.filter((node) => node.kind === "start");
  const endNodes = diagram.nodes.filter((node) => node.kind === "end");
  const { incoming, outgoing } = edgeBuckets(diagram.edges);

  requireFlowchartInvariant(
    startNodes.length === 1,
    `Flowchart must contain exactly one start node; found ${startNodes.length}.`,
  );
  requireFlowchartInvariant(
    endNodes.length >= 1,
    "Flowchart must contain at least one end node.",
  );

  for (const node of diagram.nodes) {
    const incomingEdges = incoming.get(node.id) ?? [];
    const outgoingEdges = outgoing.get(node.id) ?? [];

    if (node.kind === "start") {
      requireFlowchartInvariant(
        incomingEdges.length === 0,
        `Start node "${node.id}" cannot have incoming edges.`,
      );
    } else {
      requireFlowchartInvariant(
        incomingEdges.length > 0,
        `Node "${node.id}" must be reachable from another node.`,
      );
    }

    if (node.kind === "end") {
      requireFlowchartInvariant(
        outgoingEdges.length === 0,
        `End node "${node.id}" cannot have outgoing edges.`,
      );
      continue;
    }

    requireFlowchartInvariant(
      outgoingEdges.length > 0,
      `Node "${node.id}" must have at least one outgoing edge.`,
    );

    if (node.kind === "decision") {
      validateDecisionBranches(node, outgoingEdges);
    }
  }

  return diagram;
}

export function parseFlowchartDiagram(input: unknown): FlowchartDiagram {
  return validateFlowchartDiagram(FlowchartDiagramSchema.parse(input));
}

export const flowchartFixture = parseFlowchartDiagram({
  id: "onboarding-flow",
  title: "Sketchi onboarding decision flow",
  type: flowchartDiagramType,
  nodes: [
    { id: "prompt", label: "Prompt received", kind: "start" },
    { id: "requirements", label: "Extract requirements", kind: "process" },
    { id: "clear", label: "Scope clear?", kind: "decision" },
    { id: "draft", label: "Draft typed IR", kind: "process" },
    { id: "review", label: "Review diagram", kind: "end" },
  ],
  edges: [
    { id: "prompt-requirements", source: "prompt", target: "requirements" },
    { id: "requirements-clear", source: "requirements", target: "clear" },
    { id: "clear-draft", source: "clear", target: "draft", label: "yes" },
    {
      id: "clear-review",
      source: "clear",
      target: "review",
      label: "no",
    },
    { id: "draft-review", source: "draft", target: "review" },
  ],
  layout: {
    direction: "TB",
    edgeRouting: "orthogonal",
  },
  style: {
    accentColor: "#0f766e",
    backgroundColor: "#ffffff",
  },
});

export const pharmaBatchDispositionFlowchart = parseFlowchartDiagram({
  id: "pharma-batch-disposition",
  title: "Pharma batch disposition flow",
  type: flowchartDiagramType,
  nodes: [
    { id: "batch-received", label: "Batch received", kind: "start" },
    {
      id: "qa-review",
      label: "QA reviews Certificate of Analysis",
      kind: "process",
    },
    { id: "passes-specs", label: "Passes specs?", kind: "decision" },
    { id: "final-review", label: "QA Manager final review", kind: "process" },
    { id: "packaging", label: "Send to packaging", kind: "end" },
    { id: "investigate", label: "Investigate retesting", kind: "process" },
    { id: "reject", label: "Reject batch", kind: "end" },
  ],
  edges: [
    { id: "batch-qa", source: "batch-received", target: "qa-review" },
    { id: "qa-specs", source: "qa-review", target: "passes-specs" },
    {
      id: "specs-pass",
      source: "passes-specs",
      target: "final-review",
      label: "yes",
    },
    {
      id: "specs-investigate",
      source: "passes-specs",
      target: "investigate",
      label: "retest",
    },
    {
      id: "specs-reject",
      source: "passes-specs",
      target: "reject",
      label: "reject",
    },
    { id: "review-packaging", source: "final-review", target: "packaging" },
    { id: "investigate-review", source: "investigate", target: "final-review" },
  ],
  layout: {
    direction: "TB",
    edgeRouting: "orthogonal",
  },
  style: {
    accentColor: "#0f766e",
    backgroundColor: "#ffffff",
  },
});

export const flowchartEvaluationFixtures = [
  flowchartFixture,
  pharmaBatchDispositionFlowchart,
];
