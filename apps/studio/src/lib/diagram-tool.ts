import {
  type IntermediateDiagram,
  parseIntermediateDiagram,
} from "@sketchi/diagram-core";
import { z } from "zod";

/**
 * Shared contract for the `create_diagram` agent tool.
 *
 * The input schema is a Gemini-friendly subset of the core IR (flat objects,
 * no records, no ids the model can get wrong); `normalizeDiagramInput` lifts
 * it into a full `IntermediateDiagram` with sketchbook styling, and
 * `gradeDiagram` produces the deterministic report that drives the agent's
 * revise loop. Imported by both the server route (validate + grade) and the
 * client (render exactly what was graded).
 */

export const NODE_KINDS = [
  "start",
  "end",
  "process",
  "decision",
  "data",
  "external",
] as const;

export const DiagramToolInputSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe("Short, specific diagram title shown above the canvas"),
  direction: z
    .enum(["TB", "LR"])
    .optional()
    .describe("TB for tall step-by-step flows, LR for pipelines"),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1).describe("Short kebab-case unique id"),
        label: z.string().min(1).describe("Specific label, 5 words max"),
        kind: z
          .enum(NODE_KINDS)
          .optional()
          .describe(
            "start/end render as ovals, decision as a diamond, others as boxes",
          ),
      }),
    )
    .min(1),
  edges: z
    .array(
      z.object({
        source: z.string().min(1).describe("Source node id"),
        target: z.string().min(1).describe("Target node id"),
        label: z
          .string()
          .optional()
          .describe("Edge label, e.g. decision branches: yes / no"),
      }),
    )
    .default([]),
});

export type DiagramToolInput = z.infer<typeof DiagramToolInputSchema>;

const SKETCHI_ACCENT = "#8f707f";
const SKETCHI_PAPER = "#fffdf8";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function normalizeDiagramInput(
  input: DiagramToolInput,
): IntermediateDiagram {
  return parseIntermediateDiagram({
    id: slugify(input.title) || "sketchi-diagram",
    title: input.title,
    type: "flowchart",
    nodes: input.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      ...(node.kind ? { kind: node.kind } : {}),
    })),
    edges: input.edges.map((edge, index) => ({
      id: `edge-${index + 1}`,
      source: edge.source,
      target: edge.target,
      ...(edge.label?.trim() ? { label: edge.label.trim() } : {}),
    })),
    layout: {
      direction: input.direction ?? "TB",
      edgeRouting: "orthogonal",
    },
    style: {
      accentColor: SKETCHI_ACCENT,
      backgroundColor: SKETCHI_PAPER,
    },
  });
}

export interface DiagramGradeReport {
  accepted: boolean;
  /** 0–10, one decimal. */
  grade: number;
  /** 1-based attempt number within this agent turn. */
  attempt: number;
  /** Human-readable findings, prefixed "error:" or "warn:". */
  issues: string[];
  /** e.g. "8 nodes · 9 edges" */
  summary: string;
}

const ACCEPT_THRESHOLD = 8;
const GENERIC_LABEL = /^(node|step|item|box|thing|process|task)\s*\d*$/i;
const GENERIC_TITLE = /^(diagram|untitled|flowchart|chart|sketch)$/i;

function connectedComponentCount(diagram: IntermediateDiagram): number {
  const adjacency = new Map<string, string[]>();
  for (const node of diagram.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of diagram.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  const seen = new Set<string>();
  let components = 0;
  for (const node of diagram.nodes) {
    if (seen.has(node.id)) {
      continue;
    }
    components += 1;
    const queue = [node.id];
    seen.add(node.id);
    while (queue.length > 0) {
      const current = queue.pop();
      if (current === undefined) {
        break;
      }
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
  return components;
}

function isDecision(node: IntermediateDiagram["nodes"][number]): boolean {
  return node.kind?.toLowerCase() === "decision" || node.label.endsWith("?");
}

export function gradeDiagram(
  diagram: IntermediateDiagram,
): Omit<DiagramGradeReport, "attempt"> {
  const issues: string[] = [];
  let penalty = 0;

  const fault = (points: number, message: string, error = false) => {
    penalty += points;
    issues.push(`${error ? "error" : "warn"}: ${message}`);
  };

  const degree = new Map<string, number>();
  const outgoing = new Map<string, IntermediateDiagram["edges"]>();
  for (const edge of diagram.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }

  if (diagram.nodes.length > 1 && diagram.edges.length === 0) {
    fault(5, "no edges at all — every node floats unconnected", true);
  } else {
    const orphans = diagram.nodes.filter(
      (node) => (degree.get(node.id) ?? 0) === 0,
    );
    if (orphans.length > 0 && diagram.nodes.length > 1) {
      fault(
        Math.min(1.5 * orphans.length, 4.5),
        `unconnected node(s): ${orphans.map((node) => node.id).join(", ")}`,
        true,
      );
    }
    const components = connectedComponentCount(diagram);
    if (components > 1 && orphans.length === 0) {
      fault(2, `diagram splits into ${components} disconnected islands`, true);
    }
  }

  if (diagram.nodes.length < 3) {
    fault(2, "too sparse — a useful flow needs at least 3 nodes");
  } else if (diagram.nodes.length > 24) {
    fault(2, "too dense — trim or merge nodes (24 max)");
  }

  const labelCounts = new Map<string, number>();
  for (const node of diagram.nodes) {
    const key = node.label.trim().toLowerCase();
    labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1);
  }
  const duplicates = [...labelCounts.entries()].filter(
    ([, count]) => count > 1,
  );
  if (duplicates.length > 0) {
    fault(
      Math.min(duplicates.length, 3),
      `duplicate label(s): ${duplicates.map(([label]) => `"${label}"`).join(", ")}`,
    );
  }

  let underBranched = 0;
  let unlabeledBranches = 0;
  for (const node of diagram.nodes.filter(isDecision)) {
    const branches = outgoing.get(node.id) ?? [];
    if (branches.length < 2) {
      underBranched += 1;
      issues.push(
        `error: decision "${node.id}" needs at least 2 outgoing branches`,
      );
    } else if (branches.some((edge) => !edge.label)) {
      unlabeledBranches += 1;
      issues.push(
        `warn: label every branch out of decision "${node.id}" (yes/no, …)`,
      );
    }
  }
  penalty += Math.min(1.5 * underBranched, 4.5) + Math.min(unlabeledBranches, 3);

  const longLabels = diagram.nodes.filter((node) => node.label.length > 42);
  if (longLabels.length > 0) {
    fault(
      Math.min(0.5 * longLabels.length, 2),
      `shorten label(s): ${longLabels.map((node) => node.id).join(", ")}`,
    );
  }

  const genericLabels = diagram.nodes.filter((node) =>
    GENERIC_LABEL.test(node.label.trim()),
  );
  if (genericLabels.length > 0) {
    fault(
      Math.min(genericLabels.length, 3),
      `generic label(s) say nothing: ${genericLabels.map((node) => `"${node.label}"`).join(", ")}`,
    );
  }

  if (diagram.title.trim().length < 4 || GENERIC_TITLE.test(diagram.title.trim())) {
    fault(0.5, "give the diagram a specific title");
  }

  const grade = Math.max(0, Math.round((10 - penalty) * 10) / 10);

  return {
    accepted: grade >= ACCEPT_THRESHOLD,
    grade,
    issues,
    summary: `${diagram.nodes.length} nodes · ${diagram.edges.length} edges`,
  };
}
