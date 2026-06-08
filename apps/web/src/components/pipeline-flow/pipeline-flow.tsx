export interface PipelineStage {
  desc: string;
  name: string;
  pkg: string;
}

export interface PipelineFlowProps {
  stages?: readonly PipelineStage[];
}

const defaultStages: readonly PipelineStage[] = [
  {
    desc: "A prompt is planned into a generated tool: generate, restructure, or tweak.",
    name: "Prompt",
    pkg: "diagram-generation",
  },
  {
    desc: "Generation emits a typed intermediate diagram — nodes, edges, layout hints.",
    name: "Typed IR",
    pkg: "diagram-core",
  },
  {
    desc: "Shape, references, and diagram-type invariants are validated before render.",
    name: "Validate",
    pkg: "diagram-core",
  },
  {
    desc: "The diagram becomes a deterministic scene: layout, text fit, arrow routing.",
    name: "Render",
    pkg: "diagram-renderer",
  },
  {
    desc: "The scene converts to real Excalidraw elements with bound arrows and text.",
    name: "Excalidraw",
    pkg: "diagram-excalidraw",
  },
];

export function PipelineFlow({ stages = defaultStages }: PipelineFlowProps) {
  return (
    <ol aria-label="Diagram generation pipeline" className="pipeline-flow">
      {stages.map((stage, index) => (
        <li className="pipeline-flow__stage" key={stage.name}>
          <span className="pipeline-flow__index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="pipeline-flow__name">{stage.name}</h3>
          <p className="pipeline-flow__desc">{stage.desc}</p>
          <span className="pipeline-flow__pkg">{stage.pkg}</span>
        </li>
      ))}
    </ol>
  );
}
