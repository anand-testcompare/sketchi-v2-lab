import { createFileRoute } from "@tanstack/react-router";

import { ExcalidrawWorkspace } from "../components/excalidraw-workspace/index.js";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return <ExcalidrawWorkspace />;
}
