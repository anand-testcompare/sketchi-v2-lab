import { z } from "zod";

/**
 * Transport-facing contract for the `create_diagram` agent tool.
 *
 * The input schema is a Gemini-friendly subset of the core IR (flat objects,
 * no records, no ids the model can get wrong). It stays Zod on purpose: AI
 * SDK tool declarations, MCP tool catalogs, and HTTP routes all consume it
 * directly, while the Effect pipeline in `evaluate.ts` owns the typed
 * failure paths behind it.
 */

export const CREATE_DIAGRAM_TOOL_NAME = "create_diagram" as const;

export const CREATE_DIAGRAM_TOOL_DESCRIPTION =
  "Create or replace the diagram on the user's canvas. Validates the structure and returns a grade report; revise and call again until accepted.";

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
