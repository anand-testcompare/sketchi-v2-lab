import { describe, expect, it } from "vitest";

import { gradeDiagram } from "./grade";
import { normalizeDiagramInput } from "./normalize";

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
