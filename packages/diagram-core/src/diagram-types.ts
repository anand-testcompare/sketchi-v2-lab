export const DIAGRAM_TYPES = [
  "architecture",
  "flowchart",
  "sequence",
  "state",
  "mindmap",
] as const;

export type DiagramTypeValue = (typeof DIAGRAM_TYPES)[number];
