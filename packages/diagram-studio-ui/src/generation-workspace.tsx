import {
  type IntermediateDiagram,
  validateIntermediateDiagram
} from "@sketchi/diagram-core";
import { renderIntermediateDiagram } from "@sketchi/diagram-renderer";

import { DiagramPreview } from "./diagram-preview";

export interface GenerationWorkspaceProps {
  diagram: IntermediateDiagram;
  status?: "idle" | "generating" | "ready" | "error";
}

const statusLabels = {
  idle: "Idle",
  generating: "Generating",
  ready: "Ready",
  error: "Needs attention"
};

export function GenerationWorkspace({
  diagram,
  status = "ready"
}: GenerationWorkspaceProps) {
  let validationMessage = "Validated diagram IR";

  try {
    validateIntermediateDiagram(diagram);
  } catch (error) {
    validationMessage =
      error instanceof Error ? error.message : "Diagram validation failed";
  }

  const scene = renderIntermediateDiagram(diagram);

  return (
    <section className="sketchi-generation-workspace">
      <header className="sketchi-generation-workspace__header">
        <div>
          <p className="sketchi-generation-workspace__eyebrow">Sketchi v2</p>
          <h1>{diagram.title}</h1>
        </div>
        <span className="sketchi-generation-workspace__status">
          {statusLabels[status]}
        </span>
      </header>

      <div className="sketchi-generation-workspace__meta">
        <span>{diagram.nodes.length} nodes</span>
        <span>{diagram.edges.length} edges</span>
        <span>{validationMessage}</span>
      </div>

      <DiagramPreview scene={scene} />
    </section>
  );
}
