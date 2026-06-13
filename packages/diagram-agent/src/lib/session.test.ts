import { describe, expect, it } from "vitest";

import { normalizeDiagramInput } from "./normalize";
import { createDiagramToolSession } from "./session";
import { DiagramToolInputSchema } from "./tool-contract";

function triageFlow(title = "Incident triage flow") {
  return {
    title,
    direction: "TB",
    nodes: [
      { id: "open", label: "Open incident", kind: "start" },
      { id: "severity", label: "Severity high?", kind: "decision" },
      { id: "page", label: "Page on-call engineer" },
      { id: "log", label: "Log for weekly review" },
      { id: "close", label: "Close incident", kind: "end" },
    ],
    edges: [
      { source: "open", target: "severity" },
      { source: "severity", target: "page", label: "yes" },
      { source: "severity", target: "log", label: "no" },
      { source: "page", target: "close" },
      { source: "log", target: "close" },
    ],
  };
}

/** Decision with one outgoing branch — grading rejects this revision. */
function weakRevision() {
  return {
    title: "Incident triage flow v3",
    nodes: [
      { id: "open", label: "Open incident", kind: "start" },
      { id: "severity", label: "Severity high?", kind: "decision" },
      { id: "close", label: "Close incident", kind: "end" },
    ],
    edges: [
      { source: "open", target: "severity" },
      { source: "severity", target: "close" },
    ],
  };
}

function ghostEdgeFlow() {
  return {
    title: "Broken flow",
    nodes: [{ id: "a", label: "First step" }],
    edges: [{ source: "a", target: "ghost" }],
  };
}

describe("createDiagramToolSession", () => {
  it("accepts a clean flow and records it as the turn's accepted diagram", () => {
    const session = createDiagramToolSession();
    const outcome = session.evaluate(triageFlow());

    expect(outcome.kind).toBe("graded");
    expect(outcome.report).toMatchObject({ accepted: true, attempt: 1 });
    if (outcome.kind === "graded") {
      expect(outcome.revisionOfId).toBeUndefined();
    }
    expect(session.acceptedDiagram?.id).toBe("incident-triage-flow");
  });

  it("marks later attempts as revisions and replaces the accepted diagram on accept", () => {
    const session = createDiagramToolSession();
    session.evaluate(triageFlow());
    const outcome = session.evaluate(triageFlow("Incident triage flow v2"));

    expect(outcome.kind).toBe("graded");
    if (outcome.kind === "graded") {
      expect(outcome.revisionOfId).toBe("incident-triage-flow");
      expect(outcome.report.accepted).toBe(true);
    }
    expect(session.acceptedDiagram?.id).toBe("incident-triage-flow-v2");
  });

  it("keeps the prior accepted diagram when a revision fails the grade", () => {
    const session = createDiagramToolSession();
    session.evaluate(triageFlow());
    const outcome = session.evaluate(weakRevision());

    expect(outcome.kind).toBe("graded");
    if (outcome.kind === "graded") {
      expect(outcome.report.accepted).toBe(false);
      expect(outcome.revisionOfId).toBe("incident-triage-flow");
    }
    expect(session.acceptedDiagram?.id).toBe("incident-triage-flow");
  });

  it("treats priorAccepted from an earlier turn as revision context", () => {
    const prior = normalizeDiagramInput(
      DiagramToolInputSchema.parse(triageFlow()),
    );
    const session = createDiagramToolSession({ priorAccepted: prior });
    const outcome = session.evaluate(triageFlow("Incident triage flow v2"));

    expect(outcome.kind).toBe("graded");
    if (outcome.kind === "graded") {
      expect(outcome.revisionOfId).toBe("incident-triage-flow");
    }
    expect(session.acceptedDiagram?.id).toBe("incident-triage-flow-v2");
  });

  it("stops with the attempt-limit report after the per-turn cap", () => {
    const session = createDiagramToolSession();
    session.evaluate(ghostEdgeFlow());
    session.evaluate(ghostEdgeFlow());
    session.evaluate(ghostEdgeFlow());
    const outcome = session.evaluate(ghostEdgeFlow());

    expect(outcome.kind).toBe("attempt-limit");
    expect(outcome.report).toMatchObject({
      accepted: false,
      grade: 0,
      attempt: 4,
      summary: "stopped",
    });
    expect(outcome.report.issues).toEqual([
      "error: attempt limit reached — stop calling create_diagram this turn and summarize the flow in chat instead",
    ]);
  });

  it("returns the typed invalid-input outcome for malformed args", () => {
    const session = createDiagramToolSession();
    const outcome = session.evaluate({ nodes: "not-a-list" });

    expect(outcome.kind).toBe("invalid-input");
    expect(outcome.report.accepted).toBe(false);
    expect(outcome.report.summary).toBe("did not validate");
    expect(outcome.report.issues[0]).toBe(
      "error: invalid create_diagram arguments",
    );
    expect(session.attempts).toBe(1);
  });

  it("returns the structure outcome with the node-id repair hint", () => {
    const session = createDiagramToolSession();
    const outcome = session.evaluate(ghostEdgeFlow());

    expect(outcome.kind).toBe("invalid-structure");
    if (outcome.kind === "invalid-structure") {
      expect(outcome.reason).toMatch(/missing target node "ghost"/);
      expect(outcome.nodeIds).toEqual(["a"]);
    }
    expect(outcome.report.issues[1]).toBe(
      "the node ids you defined are: a — every edge source/target must exactly match one of these",
    );
  });
});
