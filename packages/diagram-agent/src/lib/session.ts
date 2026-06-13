import type { IntermediateDiagram } from "@sketchi/diagram-core";
import { Effect, Either } from "effect";

import { evaluateDiagramAttempt } from "./evaluate.js";
import type { DiagramGradeReport } from "./tool-contract.js";

/**
 * Attempt/repair policy for one agent turn. The session counts attempts,
 * enforces the hard per-turn limit, and remembers the last accepted diagram
 * so later attempts are evaluated as revisions of it.
 *
 * Every outcome carries a model-facing `report` in the exact shape the
 * studio spike streamed back to Gemini; adapters return `outcome.report`
 * verbatim and use the discriminated `kind` plus the extra fields for UI,
 * persistence, or eval plumbing.
 */

export const DEFAULT_MAX_TOOL_ATTEMPTS = 3;

const ATTEMPT_LIMIT_ISSUE =
  "error: attempt limit reached — stop calling create_diagram this turn and summarize the flow in chat instead";

export type DiagramToolOutcome =
  | {
      readonly kind: "graded";
      readonly report: DiagramGradeReport;
      readonly diagram: IntermediateDiagram;
      /** Set when this attempt revises a previously accepted diagram. */
      readonly revisionOfId?: string;
    }
  | {
      readonly kind: "invalid-input";
      readonly report: DiagramGradeReport;
      readonly issues: ReadonlyArray<string>;
    }
  | {
      readonly kind: "invalid-structure";
      readonly report: DiagramGradeReport;
      readonly reason: string;
      readonly nodeIds: ReadonlyArray<string>;
    }
  | {
      readonly kind: "attempt-limit";
      readonly report: DiagramGradeReport;
    };

export interface DiagramToolSessionOptions {
  /** Hard cap on attempts per turn; defaults to {@link DEFAULT_MAX_TOOL_ATTEMPTS}. */
  maxAttempts?: number;
  /** Accepted diagram from an earlier turn, so this turn grades as a revision. */
  priorAccepted?: IntermediateDiagram;
}

export interface DiagramToolSession {
  evaluate(input: unknown): DiagramToolOutcome;
  readonly attempts: number;
  readonly acceptedDiagram: IntermediateDiagram | undefined;
}

function rejectionReport(
  attempt: number,
  issues: string[],
  summary: string,
): DiagramGradeReport {
  return { accepted: false, grade: 0, attempt, issues, summary };
}

export function createDiagramToolSession(
  options: DiagramToolSessionOptions = {},
): DiagramToolSession {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_TOOL_ATTEMPTS;
  let attempts = 0;
  let acceptedDiagram = options.priorAccepted;

  return {
    get attempts() {
      return attempts;
    },
    get acceptedDiagram() {
      return acceptedDiagram;
    },
    evaluate(input: unknown): DiagramToolOutcome {
      attempts += 1;
      if (attempts > maxAttempts) {
        return {
          kind: "attempt-limit",
          report: rejectionReport(attempts, [ATTEMPT_LIMIT_ISSUE], "stopped"),
        };
      }

      const result = Effect.runSync(
        Effect.either(evaluateDiagramAttempt(input)),
      );
      if (Either.isLeft(result)) {
        const error = result.left;
        if (error._tag === "DiagramToolInputError") {
          return {
            kind: "invalid-input",
            issues: error.issues,
            report: rejectionReport(
              attempts,
              [
                "error: invalid create_diagram arguments",
                ...error.issues.map((issue) => `error: ${issue}`),
              ],
              "did not validate",
            ),
          };
        }
        return {
          kind: "invalid-structure",
          reason: error.reason,
          nodeIds: error.nodeIds,
          report: rejectionReport(
            attempts,
            [
              `error: ${error.reason}`,
              `the node ids you defined are: ${error.nodeIds.join(", ") || "(none)"} — every edge source/target must exactly match one of these`,
            ],
            "did not validate",
          ),
        };
      }

      const { diagram, report } = result.right;
      const prior = acceptedDiagram;
      if (report.accepted) {
        acceptedDiagram = diagram;
      }
      return {
        kind: "graded",
        diagram,
        report: { ...report, attempt: attempts },
        ...(prior ? { revisionOfId: prior.id } : {}),
      };
    },
  };
}
