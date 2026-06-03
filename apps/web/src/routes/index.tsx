import { createFileRoute } from "@tanstack/react-router";

import { flowchartFixture } from "@sketchi/diagram-core";
import {
  GenerationWorkspace,
  type GenerationWorkspaceProps,
} from "@sketchi/diagram-studio-ui";
import "@sketchi/diagram-studio-ui/styles.css";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const props = {
    diagram: flowchartFixture,
    status: "ready",
  } satisfies GenerationWorkspaceProps;

  return <GenerationWorkspace {...props} />;
}
