import type { IntermediateDiagram } from "@sketchi/diagram-core";
import { Effect } from "effect";

import { cleanToolString } from "./clean-tool-string.js";
import {
  DiagramStructureError,
  DiagramToolInputError,
  type DiagramAttemptError,
} from "./errors.js";
import { gradeDiagram } from "./grade.js";
import { normalizeDiagramInput } from "./normalize.js";
import {
  DiagramToolInputSchema,
  type DiagramGradeReport,
  type DiagramToolInput,
} from "./tool-contract.js";

/**
 * Effect pipeline for one `create_diagram` attempt: decode unknown args at
 * the Zod boundary, lift them into the core IR, grade the result. Every
 * failure is a tagged error, so MCP/HTTP/CLI adapters and the studio route
 * all see the same success/error union instead of thrown strings.
 */

export interface DiagramAttemptEvaluation {
  readonly diagram: IntermediateDiagram;
  readonly report: Omit<DiagramGradeReport, "attempt">;
}

export function decodeDiagramToolInput(
  input: unknown,
): Effect.Effect<DiagramToolInput, DiagramToolInputError> {
  return Effect.suspend(() => {
    const parsed = DiagramToolInputSchema.safeParse(input);
    if (parsed.success) {
      return Effect.succeed(parsed.data);
    }
    return Effect.fail(
      new DiagramToolInputError({
        issues: parsed.error.issues.map(
          (issue) =>
            `${issue.path.map(String).join(".") || "input"}: ${issue.message}`,
        ),
      }),
    );
  });
}

export function normalizeDiagramAttempt(
  input: DiagramToolInput,
): Effect.Effect<IntermediateDiagram, DiagramStructureError> {
  return Effect.try({
    try: () => normalizeDiagramInput(input),
    catch: (error) =>
      new DiagramStructureError({
        reason:
          error instanceof Error ? error.message : "invalid diagram structure",
        nodeIds: input.nodes
          .map((node) => cleanToolString(node.id))
          .filter((id) => id.length > 0),
      }),
  });
}

export function evaluateDiagramAttempt(
  input: unknown,
): Effect.Effect<DiagramAttemptEvaluation, DiagramAttemptError> {
  return Effect.gen(function* () {
    const decoded = yield* decodeDiagramToolInput(input);
    const diagram = yield* normalizeDiagramAttempt(decoded);
    return { diagram, report: gradeDiagram(diagram) };
  });
}
