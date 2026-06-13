import {
  type IntermediateDiagram,
  parseIntermediateDiagram,
} from "@sketchi/diagram-core";

import { cleanToolString } from "./clean-tool-string.js";
import type { DiagramToolInput } from "./tool-contract.js";

/**
 * Lift validated `create_diagram` args into a full `IntermediateDiagram`
 * with sketchbook styling. Throws when the cleaned input still violates the
 * core IR contract (e.g. an edge pointing at a node that does not exist);
 * `evaluate.ts` maps that into a typed `DiagramStructureError`.
 */

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
  const title = cleanToolString(input.title);
  return parseIntermediateDiagram({
    id: slugify(title) || "sketchi-diagram",
    title,
    type: "flowchart",
    nodes: input.nodes.map((node) => ({
      id: cleanToolString(node.id),
      label: cleanToolString(node.label),
      ...(node.kind ? { kind: node.kind } : {}),
    })),
    edges: input.edges.map((edge, index) => ({
      id: `edge-${index + 1}`,
      source: cleanToolString(edge.source),
      target: cleanToolString(edge.target),
      ...(edge.label && cleanToolString(edge.label)
        ? { label: cleanToolString(edge.label) }
        : {}),
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
