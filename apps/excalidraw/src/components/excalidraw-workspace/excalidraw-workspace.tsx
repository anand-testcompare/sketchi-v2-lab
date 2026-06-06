import type { IntermediateDiagram } from "@sketchi/diagram-core";
import { convertSceneToExcalidraw } from "@sketchi/diagram-excalidraw";
import { renderIntermediateDiagram } from "@sketchi/diagram-renderer";
import { ExcalidrawSceneCanvas } from "@sketchi/diagram-studio-ui";

export interface ExcalidrawWorkspaceProps {
  diagram: IntermediateDiagram;
  status?: "ready" | "draft" | "offline";
}

const statusLabels = {
  draft: "Draft",
  offline: "Offline",
  ready: "Ready",
};

export function ExcalidrawWorkspace({
  diagram,
  status = "ready",
}: ExcalidrawWorkspaceProps) {
  const scene = convertSceneToExcalidraw(renderIntermediateDiagram(diagram));

  return (
    <div className="sketchi-excalidraw-app">
      <header className="sketchi-excalidraw-app__topbar">
        <div className="sketchi-excalidraw-app__brand">
          <p className="sketchi-excalidraw-app__eyebrow">Sketchi Excalidraw</p>
          <h1>{diagram.title}</h1>
        </div>
        <span className="sketchi-excalidraw-app__status">
          {statusLabels[status]}
        </span>
      </header>

      <main className="sketchi-excalidraw-app__body">
        <aside className="sketchi-excalidraw-app__sidebar">
          <div>
            <h2>Workspace</h2>
            <p>
              This no-auth shell uses the same validated diagram pipeline the
              playground exercises.
            </p>
          </div>

          <div className="sketchi-excalidraw-app__metrics">
            <div
              aria-label={`${diagram.nodes.length} nodes`}
              className="sketchi-excalidraw-app__metric"
            >
              <strong>{diagram.nodes.length}</strong>
              <span>Nodes</span>
            </div>
            <div
              aria-label={`${diagram.edges.length} edges`}
              className="sketchi-excalidraw-app__metric"
            >
              <strong>{diagram.edges.length}</strong>
              <span>Edges</span>
            </div>
          </div>

          <pre className="sketchi-excalidraw-app__prompt">
            {JSON.stringify(
              {
                id: diagram.id,
                layout: diagram.layout,
                type: diagram.type,
              },
              null,
              2,
            )}
          </pre>
        </aside>

        <section className="sketchi-excalidraw-app__canvas">
          <ExcalidrawSceneCanvas
            scene={scene}
            title={`${diagram.title} canvas`}
            viewModeEnabled={false}
            zenModeEnabled={false}
          />
        </section>
      </main>
    </div>
  );
}
