import { describe, expect, it } from "vitest";

import { gradeDiagram } from "./grade";
import { normalizeDiagramInput } from "./normalize";

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
