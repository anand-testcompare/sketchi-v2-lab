import { describe, expect, it } from "vitest";

import {
  cleanToolString,
  gradeDiagram,
  normalizeDiagramInput,
} from "./diagram-tool";

describe("cleanToolString", () => {
  it("strips welded trailing key fragments seen in flash-lite tool calls", () => {
    expect(cleanToolString("start-node,kind:")).toBe("start-node");
    expect(cleanToolString("ci-pipeline,target:")).toBe("ci-pipeline");
    expect(cleanToolString("pass,source:")).toBe("pass");
    expect(cleanToolString("smoke-check,target:,source:")).toBe("smoke-check");
  });

  it("keeps legitimate commas that are not key fragments", () => {
    expect(cleanToolString("Rollback, then alert")).toBe(
      "Rollback, then alert",
    );
    expect(cleanToolString("Deploy with Wrangler")).toBe(
      "Deploy with Wrangler",
    );
  });
});

describe("normalizeDiagramInput", () => {
  it("repairs the corrupted deploy-pipeline payload observed in production", () => {
    // Verbatim shape of the model's failing attempt (PR #22 verification).
    const diagram = normalizeDiagramInput({
      title: "Deployment Pipeline Flow",
      direction: "LR",
      nodes: [
        { id: "start-node,kind:", label: "Squash merge to main" },
        { id: "ci-pipeline,kind:", label: "Run typecheck and build" },
        { id: "deploy-worker,kind:", label: "Deploy with Wrangler" },
        { id: "smoke-check,kind:", label: "Run smoke check" },
        { id: "success,kind:", label: "Deployment complete" },
        { id: "rollback,kind:", label: "Rollback worker" },
        { id: "slack-alert,kind:", label: "Alert Slack channel" },
      ],
      edges: [
        { source: "start-node", target: "ci-pipeline" },
        { source: "ci-pipeline,target:", target: "deploy-worker" },
        { source: "deploy-worker,target:", target: "smoke-check" },
        {
          source: "smoke-check,target:",
          target: "success",
          label: "pass,source:",
        },
        {
          source: "smoke-check,target:",
          target: "rollback",
          label: "fail,source:",
        },
        { source: "rollback,target:", target: "slack-alert" },
      ],
    });

    expect(diagram.nodes.map((node) => node.id)).toEqual([
      "start-node",
      "ci-pipeline",
      "deploy-worker",
      "smoke-check",
      "success",
      "rollback",
      "slack-alert",
    ]);
    expect(diagram.edges.map((edge) => edge.label)).toEqual([
      undefined,
      undefined,
      undefined,
      "pass",
      "fail",
      undefined,
    ]);

    const report = gradeDiagram(diagram);
    expect(report.issues).toEqual([]);
    expect(report.accepted).toBe(true);
  });

  it("still rejects edges that reference genuinely missing nodes", () => {
    expect(() =>
      normalizeDiagramInput({
        title: "Broken flow",
        nodes: [{ id: "a", label: "First step" }],
        edges: [{ source: "a", target: "ghost" }],
      }),
    ).toThrow(/missing target node "ghost"/);
  });
});

describe("gradeDiagram", () => {
  it("rejects under-branched decisions and unlabeled branches", () => {
    const diagram = normalizeDiagramInput({
      title: "Login decision flow",
      nodes: [
        { id: "start", label: "Open login", kind: "start" },
        { id: "check", label: "Credentials valid?", kind: "decision" },
        { id: "home", label: "Show dashboard", kind: "end" },
      ],
      edges: [
        { source: "start", target: "check" },
        { source: "check", target: "home" },
      ],
    });

    const report = gradeDiagram(diagram);
    expect(report.accepted).toBe(false);
    expect(
      report.issues.some((issue) => issue.includes("outgoing branches")),
    ).toBe(true);
  });
});
