import { createFileRoute } from "@tanstack/react-router";

import { pharmaBatchDispositionFlowchart } from "@sketchi/diagram-core";

import { ExcalidrawWorkspace } from "../components/excalidraw-workspace/index.js";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <ExcalidrawWorkspace
      diagram={pharmaBatchDispositionFlowchart}
      status="ready"
    />
  );
}
