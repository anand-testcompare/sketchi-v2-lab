import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";

import { evaluateDiagramAttempt } from "./evaluate";

function run(input: unknown) {
  return Effect.runSync(Effect.either(evaluateDiagramAttempt(input)));
}

describe("evaluateDiagramAttempt", () => {
  it("fails malformed tool args with a typed input error listing field issues", () => {
    const result = run({ nodes: "not-a-list" });

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("DiagramToolInputError");
      if (result.left._tag === "DiagramToolInputError") {
        expect(
          result.left.issues.some((issue) => issue.startsWith("title:")),
        ).toBe(true);
        expect(
          result.left.issues.some((issue) => issue.startsWith("nodes:")),
        ).toBe(true);
      }
    }
  });

  it("fails ghost edge targets with a typed structure error and repair ids", () => {
    const result = run({
      title: "Broken flow",
      nodes: [{ id: "a", label: "First step" }],
      edges: [{ source: "a", target: "ghost" }],
    });

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("DiagramStructureError");
      if (result.left._tag === "DiagramStructureError") {
        expect(result.left.reason).toMatch(/missing target node "ghost"/);
        expect(result.left.nodeIds).toEqual(["a"]);
      }
    }
  });

  it("returns the graded diagram for valid input", () => {
    const result = run({
      title: "Nightly backup flow",
      nodes: [
        { id: "trigger", label: "Cron fires at 02:00", kind: "start" },
        { id: "snapshot", label: "Snapshot database" },
        { id: "upload", label: "Upload to R2", kind: "end" },
      ],
      edges: [
        { source: "trigger", target: "snapshot" },
        { source: "snapshot", target: "upload" },
      ],
    });

    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.diagram.id).toBe("nightly-backup-flow");
      expect(result.right.report.accepted).toBe(true);
      expect(result.right.report.issues).toEqual([]);
    }
  });
});
